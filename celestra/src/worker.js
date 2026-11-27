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
    // hub: profiles, leaderboard, replays, feedback, open rooms
    if (/^\/api\/(profile|leaderboard|rooms|replay|feedback|use|tourney)(\/|$)/.test(p)) {
      const hub = env.HUB.get(env.HUB.idFromName("hub"));
      const u = new URL(req.url); u.pathname = p.replace("/api", "");
      if (p.startsWith("/api/feedback") && req.method === "GET" && u.searchParams.get("key") !== env.ADMIN_KEY) return json({ error: "forbidden" }, 403);
      return hub.fetch(new Request(u, req));
    }
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
    const uid = (url.searchParams.get("uid") || "").replace(/[^\w-]/g, "").slice(0, 40);
    const pub = url.searchParams.get("pub") === "1";
    const title = (url.searchParams.get("title") || "").replace(/[^\w !.'-]/g, "").slice(0, 20);
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
    s.serializeAttachment({ slot, name, pid, uid, title, char: keepChar, ready: false });
    const meta = await this.meta();
    meta.code = code;
    if (slot === 0 && !prev) meta.pub = pub;
    if (meta.phase !== "select") { meta.phase = "select"; meta.rematch = [false, false]; }
    await this.save();
    s.send(JSON.stringify({ t: "welcome", slot, code }));
    this.broadcastRoom();
    this.ctx.waitUntil(this.listing());
    return new Response(null, { status: 101, webSocket: c });
  }
  roomState(except) {
    const socks = this.sockets(except);
    const players = socks.map((ws) => (ws ? (({ name, char, ready, evo, alt, title }) => ({ name, char, ready, evo: !!evo, alt: !!alt, title: title || "", here: true }))(ws.deserializeAttachment()) : null));
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
    if (raw.startsWith('{"t":"in"') || raw.startsWith('{"t":"chk"') || raw.startsWith('{"t":"pp"') || raw.startsWith('{"t":"pq"') || raw.startsWith('{"t":"emote"') || raw.startsWith('{"t":"rtc"')) {
      this.broadcast(raw, ws); return;
    }
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === "ping") { ws.send(JSON.stringify({ t: "pong", ts: m.ts })); return; }
    if (m.t === "stats") { // connection quality report from a client (shows up in Workers logs)
      const at = ws.deserializeAttachment() || {};
      console.log(JSON.stringify({ stats: 1, room: (this._meta && this._meta.code) || "", slot: at.slot, path: String(m.path).slice(0, 8), peerRtt: m.peerRtt | 0, srvRtt: m.srvRtt | 0, rb: m.rb | 0, stalls: m.stalls | 0, frame: m.frame | 0, delay: m.delay | 0, fps: m.fps | 0, ua: String(m.ua || "").slice(0, 40) }));
      return;
    }
    const a = ws.deserializeAttachment();
    const meta = await this.meta();
    switch (m.t) {
      case "pick":
        if (meta.phase !== "select") return;
        a.char = typeof m.char === "string" ? m.char.slice(0, 12) : null; a.evo = !!m.evo; a.alt = !!m.alt; a.ready = false; ws.serializeAttachment(a); this.broadcastRoom(); break;
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
      case "result": {
        // both players report the outcome; record it once they agree
        if (meta.phase !== "match") return;
        meta.results ||= {};
        if (meta.results.done === meta.round) return;
        meta.results[a.slot] = { w: m.winner | 0, n: meta.round };
        const r0 = meta.results[0], r1 = meta.results[1];
        if (r0 && r1 && r0.n === meta.round && r1.n === meta.round && r0.w === r1.w) {
          meta.results.done = meta.round;
          const ps = this.sockets().map((w) => w && w.deserializeAttachment());
          if (ps[0] && ps[1]) this.ctx.waitUntil(this.env.HUB.get(this.env.HUB.idFromName("hub")).fetch("https://hub/result", { method: "POST", body: JSON.stringify({ code: meta.code, uids: [ps[0].uid, ps[1].uid], names: [ps[0].name, ps[1].name], chars: [ps[0].char, ps[1].char], winner: r0.w }) }).catch(() => {}));
        }
        await this.save();
        break;
      }
      case "select": {
        meta.phase = "select"; meta.rematch = [false, false]; await this.save();
        for (const w of this.sockets()) if (w) { const at = w.deserializeAttachment(); at.ready = false; w.serializeAttachment(at); }
        this.broadcast({ t: "toSelect" }); this.broadcastRoom(); break;
      }
    }
  }
  // tell the hub whether this room should appear in the open-rooms list
  async listing(except) {
    try {
      const meta = await this.meta();
      const socks = this.sockets(except).filter(Boolean);
      const host = socks[0] ? socks[0].deserializeAttachment() : null;
      await this.env.HUB.get(this.env.HUB.idFromName("hub")).fetch("https://hub/rooms", { method: "POST", body: JSON.stringify({ code: meta.code, n: socks.length, pub: !!meta.pub, host: host ? host.name : "", char: host ? host.char : null, phase: meta.phase }) });
    } catch {}
  }
  async start(ps) {
    const meta = await this.meta();
    meta.phase = "match"; meta.rematch = [false, false]; meta.round++; meta.results = {};
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] | 0;
    await this.save();
    this.broadcast({ t: "start", seed, stage: meta.stage, chars: [ps[0].char, ps[1].char], names: [ps[0].name, ps[1].name], evo: [!!ps[0].evo, !!ps[1].evo], alt: [!!ps[0].alt, !!ps[1].alt], titles: [ps[0].title || "", ps[1].title || ""], delay: 2, n: meta.round });
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
    await this.listing(ws);
  }
  async webSocketError(ws) { await this.webSocketClose(ws); }
}

// Global hub (SQLite): player profiles + leaderboard, match history, replays,
// player concerns/feedback, and the open-rooms list.
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").slice(0, n);
export class Hub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS players (uid TEXT PRIMARY KEY, name TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, draws INTEGER DEFAULT 0, chars TEXT DEFAULT '{}', seen INTEGER);
      CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, a TEXT, b TEXT, an TEXT, bn TEXT, ac TEXT, bc TEXT, winner INTEGER);
      CREATE TABLE IF NOT EXISTS replays (id TEXT PRIMARY KEY, at INTEGER, title TEXT, data TEXT);
      CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, name TEXT, cat TEXT, text TEXT, device TEXT);
      CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, host TEXT, char TEXT, n INTEGER, pub INTEGER, phase TEXT, at INTEGER);`);
    try { this.sql.exec("ALTER TABLE players ADD COLUMN uses TEXT DEFAULT '{}'"); } catch {} // per-fighter match counts (evolution)
    try { this.sql.exec("ALTER TABLE players ADD COLUMN title TEXT DEFAULT ''"); } catch {}
    try { this.sql.exec("ALTER TABLE players ADD COLUMN champs INTEGER DEFAULT 0"); } catch {}
    this.sql.exec(`CREATE TABLE IF NOT EXISTS tournaments (id TEXT PRIMARY KEY, name TEXT, size INTEGER, status TEXT, host TEXT, hostName TEXT, created INTEGER, champion TEXT, championName TEXT);
      CREATE TABLE IF NOT EXISTS tplayers (tid TEXT, uid TEXT, name TEXT, PRIMARY KEY (tid, uid));
      CREATE TABLE IF NOT EXISTS tmatches (tid TEXT, round INTEGER, slot INTEGER, a TEXT, b TEXT, an TEXT, bn TEXT, code TEXT, winner TEXT, PRIMARY KEY (tid, round, slot));`);
  }
  q(sql, ...b) { return this.sql.exec(sql, ...b).toArray(); }
  async fetch(req) {
    const url = new URL(req.url), p = url.pathname, now = Date.now();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (p === "/profile" && req.method === "POST") {
      const uid = clean(body.uid, 40), name = clean(body.name, 14).toUpperCase();
      if (!uid || !name) return json({ error: "bad" }, 400);
      this.q("INSERT INTO players (uid, name, seen) VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET name = excluded.name, seen = excluded.seen", uid, name, now);
      if (typeof body.title === "string") this.q("UPDATE players SET title = ? WHERE uid = ?", clean(body.title, 20), uid);
      return json(this.profile(uid));
    }
    if (p === "/profile") return json(this.profile(clean(url.searchParams.get("uid"), 40)));
    if (p === "/use" && req.method === "POST") {
      const uid = clean(body.uid, 40), ch = clean(body.ch, 12);
      if (!uid || !ch) return json({ ok: false });
      this.q("INSERT INTO players (uid, name, seen) VALUES (?, '', ?) ON CONFLICT(uid) DO NOTHING", uid, now);
      const u = JSON.parse(this.q("SELECT uses FROM players WHERE uid = ?", uid)[0]?.uses || "{}");
      u[ch] = (u[ch] || 0) + 1;
      this.q("UPDATE players SET uses = ? WHERE uid = ?", JSON.stringify(u), uid);
      return json({ ok: true, uses: u[ch] });
    }
    if (p === "/leaderboard") {
      const rows = this.q("SELECT name, wins, losses, draws, chars, title, champs FROM players WHERE wins + losses + draws > 0 ORDER BY wins DESC, (wins * 1.0 / (wins + losses + 1)) DESC LIMIT 30");
      return json(rows.map((r) => ({ name: r.name, wins: r.wins, losses: r.losses, draws: r.draws, main: topChar(r.chars), title: r.title || "", champs: r.champs || 0 })));
    }
    if (p === "/result" && req.method === "POST") {
      const [a, b] = body.uids || [], w = body.winner;
      if (!a || !b) return json({ ok: false });
      this.q("INSERT INTO matches (at, a, b, an, bn, ac, bc, winner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", now, a, b, clean(body.names?.[0], 14), clean(body.names?.[1], 14), clean(body.chars?.[0], 12), clean(body.chars?.[1], 12), w);
      [a, b].forEach((uid, i) => {
        this.q("INSERT INTO players (uid, name, seen) VALUES (?, ?, ?) ON CONFLICT(uid) DO NOTHING", uid, clean(body.names?.[i], 14), now);
        const r = this.q("SELECT chars FROM players WHERE uid = ?", uid)[0];
        const ch = JSON.parse(r?.chars || "{}"); const c = clean(body.chars?.[i], 12); if (c) ch[c] = (ch[c] || 0) + 1;
        const col = w < 0 ? "draws" : w === i ? "wins" : "losses";
        this.q(`UPDATE players SET ${col} = ${col} + 1, chars = ? WHERE uid = ?`, JSON.stringify(ch), uid);
      });
      if (body.code && w >= 0) this.tourneyResult(clean(body.code, 8), [a, b][w]);
      return json({ ok: true });
    }
    if (p === "/rooms" && req.method === "POST") {
      const code = clean(body.code, 8);
      if (!code) return json({ ok: false });
      if (body.n === 1 && body.pub && body.phase === "select") this.q("INSERT OR REPLACE INTO rooms (code, host, char, n, pub, phase, at) VALUES (?, ?, ?, ?, 1, ?, ?)", code, clean(body.host, 14), clean(body.char, 12), 1, "select", now);
      else this.q("DELETE FROM rooms WHERE code = ?", code);
      return json({ ok: true });
    }
    if (p === "/rooms") {
      this.q("DELETE FROM rooms WHERE at < ?", now - 15 * 60 * 1000);
      return json(this.q("SELECT code, host, char, at FROM rooms ORDER BY at DESC LIMIT 20"));
    }
    if (p === "/replay" && req.method === "POST") {
      const data = JSON.stringify(body.replay || null);
      if (data.length > 400000 || !body.replay || !Array.isArray(body.replay.inputs)) return json({ error: "bad replay" }, 400);
      const id = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
      this.q("INSERT INTO replays (id, at, title, data) VALUES (?, ?, ?, ?)", id, now, clean(body.title, 80), data);
      this.q("DELETE FROM replays WHERE id IN (SELECT id FROM replays ORDER BY at DESC LIMIT -1 OFFSET 500)");
      return json({ id });
    }
    const rm = p.match(/^\/replay\/([a-z0-9]{4,12})$/);
    if (rm) { const r = this.q("SELECT data, title FROM replays WHERE id = ?", rm[1])[0]; return r ? json({ title: r.title, replay: JSON.parse(r.data) }) : json({ error: "not found" }, 404); }
    if (p === "/feedback" && req.method === "POST") {
      const text = clean(body.text, 1500).trim();
      if (text.length < 3) return json({ error: "too short" }, 400);
      this.q("INSERT INTO feedback (at, name, cat, text, device) VALUES (?, ?, ?, ?, ?)", now, clean(body.name, 14), clean(body.cat, 16), text, clean(body.device, 20));
      this.q("DELETE FROM feedback WHERE id IN (SELECT id FROM feedback ORDER BY id DESC LIMIT -1 OFFSET 3000)");
      return json({ ok: true });
    }
    // ---- weekly tournaments ----
    if (p === "/tourney" && req.method === "GET") {
      const rows = this.q("SELECT t.id, t.name, t.size, t.status, t.hostName, t.championName, t.created, (SELECT COUNT(*) FROM tplayers WHERE tid = t.id) AS n FROM tournaments t WHERE t.created > ? ORDER BY t.created DESC LIMIT 20", now - 8 * 86400000);
      return json(rows);
    }
    if (p === "/tourney/create" && req.method === "POST") {
      const uid = clean(body.uid, 40), name = clean(body.name, 14).toUpperCase(), size = body.size === 8 ? 8 : 4;
      if (!uid || !name) return json({ error: "bad" }, 400);
      const id = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
      const tname = clean(body.tname, 28) || `${name}'S CUP`;
      this.q("INSERT INTO tournaments (id, name, size, status, host, hostName, created) VALUES (?, ?, ?, 'open', ?, ?, ?)", id, tname, size, uid, name, now);
      this.q("INSERT OR IGNORE INTO tplayers (tid, uid, name) VALUES (?, ?, ?)", id, uid, name);
      return json(this.bracket(id));
    }
    if (p === "/tourney/join" && req.method === "POST") {
      const tid = clean(body.tid, 8), uid = clean(body.uid, 40), name = clean(body.name, 14).toUpperCase();
      const t = this.q("SELECT * FROM tournaments WHERE id = ?", tid)[0];
      if (!t || !uid) return json({ error: "not found" }, 404);
      if (t.status !== "open") return json({ error: "already started" }, 409);
      this.q("INSERT OR IGNORE INTO tplayers (tid, uid, name) VALUES (?, ?, ?)", tid, uid, name);
      const n = this.q("SELECT COUNT(*) AS n FROM tplayers WHERE tid = ?", tid)[0].n;
      if (n >= t.size) this.startTourney(t);
      return json(this.bracket(tid));
    }
    if (p === "/tourney/leave" && req.method === "POST") {
      const tid = clean(body.tid, 8), uid = clean(body.uid, 40);
      const t = this.q("SELECT status FROM tournaments WHERE id = ?", tid)[0];
      if (t && t.status === "open") this.q("DELETE FROM tplayers WHERE tid = ? AND uid = ?", tid, uid);
      return json(this.bracket(tid));
    }
    const tm = p.match(/^\/tourney\/([a-z0-9]{4,10})$/);
    if (tm) return json(this.bracket(tm[1]));
    if (p === "/feedback") return json(this.q("SELECT id, at, name, cat, text, device FROM feedback ORDER BY id DESC LIMIT 500"));
    return json({ error: "not found" }, 404);
  }
  bracket(tid) {
    const t = this.q("SELECT id, name, size, status, hostName, championName, created FROM tournaments WHERE id = ?", tid)[0];
    if (!t) return { error: "not found" };
    return { ...t, players: this.q("SELECT uid, name FROM tplayers WHERE tid = ?", tid).map((r) => ({ name: r.name, uid: r.uid })),
      matches: this.q("SELECT round, slot, a, b, an, bn, code, winner FROM tmatches WHERE tid = ? ORDER BY round, slot", tid) };
  }
  startTourney(t) {
    const ps = this.q("SELECT uid, name FROM tplayers WHERE tid = ?", t.id);
    for (let i = ps.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [ps[i], ps[j]] = [ps[j], ps[i]]; }
    for (let i = 0; i < ps.length / 2; i++) this.q("INSERT INTO tmatches (tid, round, slot, a, b, an, bn, code) VALUES (?, 1, ?, ?, ?, ?, ?, ?)", t.id, i, ps[2 * i].uid, ps[2 * i + 1].uid, ps[2 * i].name, ps[2 * i + 1].name, newCode());
    this.q("UPDATE tournaments SET status = 'running' WHERE id = ?", t.id);
  }
  tourneyResult(code, winnerUid) {
    const m = this.q("SELECT * FROM tmatches WHERE code = ? AND winner IS NULL", code)[0];
    if (!m || (winnerUid !== m.a && winnerUid !== m.b)) return;
    this.q("UPDATE tmatches SET winner = ? WHERE tid = ? AND round = ? AND slot = ?", winnerUid, m.tid, m.round, m.slot);
    const round = this.q("SELECT * FROM tmatches WHERE tid = ? AND round = ? ORDER BY slot", m.tid, m.round);
    if (round.some((r) => !r.winner)) return;
    const nameOf = (r) => (r.winner === r.a ? r.an : r.bn);
    if (round.length === 1) { // final played: crown the champion
      this.q("UPDATE tournaments SET status = 'done', champion = ?, championName = ? WHERE id = ?", winnerUid, nameOf(round[0]), m.tid);
      this.q("UPDATE players SET champs = champs + 1 WHERE uid = ?", winnerUid);
      return;
    }
    for (let i = 0; i < round.length / 2; i++) {
      const x = round[2 * i], y = round[2 * i + 1];
      this.q("INSERT INTO tmatches (tid, round, slot, a, b, an, bn, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", m.tid, m.round + 1, i, x.winner, y.winner, nameOf(x), nameOf(y), newCode());
    }
  }
  profile(uid) {
    const r = uid && this.q("SELECT name, wins, losses, draws, chars, uses, title, champs FROM players WHERE uid = ?", uid)[0];
    if (!r) return { name: null, wins: 0, losses: 0, draws: 0, main: null, recent: [], uses: {} };
    const recent = this.q("SELECT at, an, bn, ac, bc, winner, a FROM matches WHERE a = ? OR b = ? ORDER BY id DESC LIMIT 6", uid, uid)
      .map((m) => { const me = m.a === uid ? 0 : 1; return { at: m.at, vs: me ? m.an : m.bn, mine: me ? m.bc : m.ac, theirs: me ? m.ac : m.bc, res: m.winner < 0 ? "D" : m.winner === me ? "W" : "L" }; });
    let rank = null;
    if (r.wins + r.losses + r.draws > 0) rank = 1 + this.q("SELECT COUNT(*) AS n FROM players WHERE wins > ?", r.wins)[0].n;
    let uses = {}; try { uses = JSON.parse(r.uses || "{}"); } catch {}
    return { name: r.name, wins: r.wins, losses: r.losses, draws: r.draws, main: topChar(r.chars), recent, rank, uses, title: r.title || "", champs: r.champs || 0 };
  }
}
function topChar(j) { try { const o = JSON.parse(j || "{}"); let b = null, n = 0; for (const k in o) if (o[k] > n) { n = o[k]; b = k; } return b; } catch { return null; } }
