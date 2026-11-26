// Celestra Chronicles — Cloudflare Worker + Durable Objects.
// Static game files from ./public are packed into src/assets.gen.js at build time.
// /api/* : room codes, quick-match queue, and WebSocket rooms (one Durable Object per room).
import { DurableObject } from "cloudflare:workers";
import ASSETS from "./assets.gen.js";

const decoded = new Map();
function serveAsset(req, url) {
  let path = url.pathname;
  if (path.endsWith("/")) path += "index.html";
  let a = ASSETS[path];
  if (!a && !path.includes(".")) { path = "/index.html"; a = ASSETS[path]; }
  if (!a) return new Response("Not found", { status: 404 });
  const etag = `"${a.e}"`;
  const cache = path === "/index.html" ? "no-cache" : path.startsWith("/voice/") ? "public, max-age=604800" : "public, max-age=300";
  if (req.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers: { etag, "cache-control": cache } });
  let body = decoded.get(path);
  if (!body) { body = Uint8Array.from(atob(a.b), (c) => c.charCodeAt(0)); decoded.set(path, body); }
  return new Response(body, { headers: { "content-type": a.t, etag, "cache-control": cache, "x-content-type-options": "nosniff" } });
}

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => ALPHA[b % ALPHA.length]).join("");
const CODE_RE = /^[A-Z0-9]{4,8}$/;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p === "/api/new") return json({ code: newCode() });
    if (p === "/api/quick") {
      const mm = env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global"));
      return mm.fetch("https://mm/quick", { method: "POST", body: url.searchParams.get("skip") || "" });
    }
    const m = p.match(/^\/api\/ws\/([A-Za-z0-9]+)$/);
    if (m) {
      const code = m[1].toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: "bad code" }, 400);
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "expected websocket" }, 426);
      const room = env.ROOMS.get(env.ROOMS.idFromName(code));
      const u = new URL(req.url); u.searchParams.set("code", code);
      return room.fetch(new Request(u, req));
    }
    if (p.startsWith("/api/")) return json({ error: "not found" }, 404);
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    return serveAsset(req, url);
  },
};

// Single global queue: hands the same room code to the next quick-match player.
export class Matchmaker extends DurableObject {
  async fetch(req) {
    const skip = (await req.text()).toUpperCase();
    const now = Date.now();
    const w = await this.ctx.storage.get("waiting");
    if (w && now - w.at < 120000 && w.code !== skip) {
      // only pair if the waiting player is still in that room, alone
      let n = 0;
      try { n = (await (await this.env.ROOMS.get(this.env.ROOMS.idFromName(w.code)).fetch("https://room/count")).json()).n; } catch {}
      await this.ctx.storage.delete("waiting");
      if (n === 1) return json({ code: w.code, host: false });
    }
    const code = newCode();
    await this.ctx.storage.put("waiting", { code, at: now });
    return json({ code, host: true });
  }
}

// One room = up to 2 players. Relays inputs between peers (rollback netcode runs client-side),
// and owns the lobby / character-select / rematch flow.
export class Room extends DurableObject {
  async meta() {
    if (!this._meta) this._meta = (await this.ctx.storage.get("meta")) || { phase: "select", stage: 0, rematch: [false, false], round: 0 };
    return this._meta;
  }
  async save() { await this.ctx.storage.put("meta", this._meta); }
  // live sockets by slot (optionally ignoring one that is closing)
  sockets(except) {
    const out = [null, null];
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const a = ws.deserializeAttachment();
      if (a && !a.gone && (a.slot === 0 || a.slot === 1)) out[a.slot] = ws;
    }
    return out;
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/count") return json({ n: this.sockets().filter(Boolean).length });
    const code = url.searchParams.get("code");
    const name = (url.searchParams.get("name") || "Player").replace(/[^\w \-.]/g, "").slice(0, 14) || "Player";
    const pid = (url.searchParams.get("pid") || "").replace(/[^\w-]/g, "").slice(0, 40);
    const [c, s] = Object.values(new WebSocketPair());
    let socks = this.sockets();
    // same player reconnecting (e.g. phone dropped the socket while switching apps):
    // retire the stale socket and give them their seat back
    let prev = null, keepChar = null;
    for (const w of socks) if (w && pid && w.deserializeAttachment().pid === pid) prev = w;
    let slot;
    if (prev) {
      const pa = prev.deserializeAttachment();
      slot = pa.slot; pa.gone = true; prev.serializeAttachment(pa);
      try { prev.close(4001, "replaced"); } catch {}
      socks = this.sockets();
      keepChar = pa.char;
    } else slot = socks[0] ? (socks[1] ? -1 : 1) : 0;
    if (slot < 0) {
      s.accept(); s.send(JSON.stringify({ t: "full" })); s.close(4000, "room full");
      return new Response(null, { status: 101, webSocket: c });
    }
    this.ctx.acceptWebSocket(s);
    s.serializeAttachment({ slot, name, pid, char: keepChar, ready: false });
    const meta = await this.meta();
    meta.code = code;
    if (meta.phase !== "select") { meta.phase = "select"; meta.rematch = [false, false]; }
    await this.save();
    s.send(JSON.stringify({ t: "welcome", slot, code }));
    this.broadcastRoom();
    return new Response(null, { status: 101, webSocket: c });
  }
  roomState(except) {
    const socks = this.sockets(except);
    const players = socks.map((ws) => (ws ? (({ name, char, ready }) => ({ name, char, ready, here: true }))(ws.deserializeAttachment()) : null));
    return { t: "room", players, stage: this._meta?.stage || 0, phase: this._meta?.phase || "select" };
  }
  broadcast(o, except) {
    const msg = typeof o === "string" ? o : JSON.stringify(o);
    for (const ws of this.ctx.getWebSockets()) { if (ws === except) continue; const a = ws.deserializeAttachment(); if (a && a.gone) continue; try { ws.send(msg); } catch {} }
  }
  broadcastRoom() { this.broadcast(this.roomState()); }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string") return;
    // hot path: relay netcode packets untouched to the other player
    if (raw.startsWith('{"t":"in"') || raw.startsWith('{"t":"chk"') || raw.startsWith('{"t":"pp"') || raw.startsWith('{"t":"pq"') || raw.startsWith('{"t":"emote"')) {
      this.broadcast(raw, ws); return;
    }
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === "ping") { ws.send(JSON.stringify({ t: "pong", ts: m.ts })); return; }
    const a = ws.deserializeAttachment();
    const meta = await this.meta();
    switch (m.t) {
      case "pick":
        if (meta.phase !== "select") return;
        a.char = typeof m.char === "string" ? m.char.slice(0, 12) : null; a.ready = false; ws.serializeAttachment(a); this.broadcastRoom(); break;
      case "ready": {
        if (meta.phase !== "select" || !a.char) return;
        a.ready = !!m.v; ws.serializeAttachment(a);
        const socks = this.sockets();
        const ps = socks.map((w) => w && w.deserializeAttachment());
        if (ps[0]?.ready && ps[1]?.ready) await this.start(ps);
        else this.broadcastRoom();
        break;
      }
      case "stage":
        if (a.slot !== 0 || meta.phase !== "select") return;
        meta.stage = Math.max(0, Math.min(2, m.stage | 0)); await this.save(); this.broadcastRoom(); break;
      case "rematch": {
        if (meta.phase !== "match") return;
        meta.rematch[a.slot] = true; await this.save();
        const ps = this.sockets().map((w) => w && w.deserializeAttachment());
        if (meta.rematch[0] && meta.rematch[1] && ps[0] && ps[1]) await this.start(ps);
        else this.broadcast({ t: "rematchReq", slot: a.slot });
        break;
      }
      case "select": {
        meta.phase = "select"; meta.rematch = [false, false]; await this.save();
        for (const w of this.sockets()) if (w) { const at = w.deserializeAttachment(); at.ready = false; w.serializeAttachment(at); }
        this.broadcast({ t: "toSelect" }); this.broadcastRoom(); break;
      }
    }
  }
  async start(ps) {
    const meta = await this.meta();
    meta.phase = "match"; meta.rematch = [false, false]; meta.round++;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] | 0;
    await this.save();
    this.broadcast({ t: "start", seed, stage: meta.stage, chars: [ps[0].char, ps[1].char], names: [ps[0].name, ps[1].name], delay: 2, n: meta.round });
  }
  async webSocketClose(ws, code, reason) {
    const a = ws.deserializeAttachment();
    try { ws.close(1000, "bye"); } catch {}
    if (!a || a.gone) return; // replaced by a reconnect — nothing changed for the rival
    a.gone = true; try { ws.serializeAttachment(a); } catch {}
    const socks = this.sockets(ws);
    if (socks[a.slot]) { this.broadcast(this.roomState(ws), ws); return; } // seat already re-taken
    const meta = await this.meta();
    meta.phase = "select"; meta.rematch = [false, false]; await this.save();
    for (const w of socks) if (w) { const at = w.deserializeAttachment(); at.ready = false; w.serializeAttachment(at); }
    this.broadcast({ t: "left", slot: a.slot }, ws);
    this.broadcast(this.roomState(ws), ws);
  }
  async webSocketError(ws) { await this.webSocketClose(ws); }
}
