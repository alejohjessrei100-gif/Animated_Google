// Online play: WebSocket room client + GGPO-style rollback session.
import { step, clone, hashState } from "./sim.js";

export class NetClient {
  constructor() { this.ws = null; this.handlers = {}; this.open = false; this.rtt = 0; this.peerRtt = 0; this._ping = null; }
  on(t, fn) { (this.handlers[t] ||= []).push(fn); }
  emit(t, m) { for (const fn of this.handlers[t] || []) fn(m); }
  connect(code, name, pid = "", extra = "") {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${location.host}/api/ws/${encodeURIComponent(code)}?name=${encodeURIComponent(name || "Player")}&pid=${encodeURIComponent(pid)}${extra}`);
      this.ws = ws;
      let settled = false;
      ws.onopen = () => { this.open = true; settled = true; resolve(); this.startPing(); };
      ws.onerror = () => { if (!settled) { settled = true; reject(new Error("connect failed")); } };
      ws.onclose = (e) => { this.open = false; clearInterval(this._ping); if (!settled) { settled = true; reject(new Error("closed")); } this.emit("close", e); };
      ws.onmessage = (ev) => this.handle(ev.data);
    });
  }
  handle(data) {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.t === "pong") { this.rtt = performance.now() - m.ts; this.emit("rtt", this.rtt); return; }
    if (m.t === "pp") { this.send({ t: "pq", ts: m.ts }); return; }
    if (m.t === "pq") { const r = performance.now() - m.ts; this.peerRtt = this.peerRtt ? this.peerRtt * 0.7 + r * 0.3 : r; this.emit("peerRtt", this.peerRtt); return; }
    if (m.t === "rtc") { this.onRtc(m); return; }
    this.emit(m.t, m);
  }

  // ---- direct peer-to-peer channel (WebRTC DataChannel) ----
  // Unordered + no retransmits, so a lost packet never holds up the next one
  // (input packets carry every unconfirmed frame, so a drop costs nothing).
  // The room WebSocket stays as signaling and as the automatic fallback.
  get direct() { return !!(this.dc && this.dc.readyState === "open"); }
  startP2P(initiator) {
    this.stopP2P();
    if (typeof RTCPeerConnection === "undefined") return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }] });
    this.pc = pc; this.pcInit = initiator; this.pendingIce = [];
    this.emit("p2p", "connecting");
    pc.onicecandidate = (e) => { if (e.candidate) this.sendWs({ t: "rtc", c: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => { if (this.pc === pc && (pc.connectionState === "failed" || pc.connectionState === "closed")) this.dcDown(pc); };
    const setup = (dc) => {
      dc.onopen = () => { if (this.pc !== pc) return; this.dc = dc; clearTimeout(this._p2pT); this.emit("p2p", "direct"); };
      dc.onclose = () => this.dcDown(pc);
      dc.onmessage = (ev) => this.handle(ev.data);
    };
    if (initiator) {
      setup(pc.createDataChannel("in", { ordered: false, maxRetransmits: 0 }));
      pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => this.sendWs({ t: "rtc", sdp: pc.localDescription.toJSON() })).catch(() => this.dcDown(pc));
    } else pc.ondatachannel = (e) => setup(e.channel);
    clearTimeout(this._p2pT);
    this._p2pT = setTimeout(() => { if (this.pc === pc && !this.direct) this.emit("p2p", "relay"); }, 9000);
  }
  async onRtc(m) {
    try {
      if (m.sdp && m.sdp.type === "offer") this.startP2P(false);
      const pc = this.pc; if (!pc) return;
      if (m.sdp) {
        await pc.setRemoteDescription(m.sdp);
        if (m.sdp.type === "offer") { await pc.setLocalDescription(await pc.createAnswer()); this.sendWs({ t: "rtc", sdp: pc.localDescription.toJSON() }); }
        for (const c of this.pendingIce.splice(0)) await pc.addIceCandidate(c).catch(() => {});
      } else if (m.c) {
        if (pc.remoteDescription) await pc.addIceCandidate(m.c).catch(() => {}); else this.pendingIce.push(m.c);
      }
    } catch { this.dcDown(this.pc); }
  }
  dcDown(pc) {
    if (pc && this.pc !== pc) return;
    const was = this.direct || !!this.pc;
    this.stopP2P();
    if (was) this.emit("p2p", "relay");
  }
  stopP2P() {
    clearTimeout(this._p2pT);
    const pc = this.pc; this.pc = null; this.dc = null;
    if (pc) try { pc.close(); } catch {}
  }
  startPing() {
    clearInterval(this._ping);
    this._ping = setInterval(() => { this.send({ t: "ping", ts: performance.now() }); this.send({ t: "pp", ts: performance.now() }); }, 1000);
  }
  sendWs(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
  send(o) {
    if (this.direct && FAST.has(o.t)) { try { this.dc.send(JSON.stringify(o)); return; } catch { this.dcDown(this.pc); } }
    this.sendWs(o);
  }
  close() { this.stopP2P(); this.byUs = true; try { this.ws && this.ws.close(1000, "leave"); } catch {} this.open = false; clearInterval(this._ping); }
}

const MAX_ROLLBACK = 12;
const FAST = new Set(["in", "chk", "pp", "pq"]);

export class RollbackSession {
  constructor(S, localSide, net, { delay = 2 } = {}) {
    this.S = S; this.local = localSide; this.net = net; this.delay = delay;
    this.frame = 0;                 // next frame to simulate
    this.localIn = new Map();
    this.remoteIn = new Map();
    this.used = new Map();          // remote input used (possibly predicted) per frame
    this.snaps = new Map();
    this.lastRemote = -1;           // highest contiguous confirmed remote frame
    this.remoteAck = -1;            // highest local frame the peer confirmed
    this.remoteFrame = 0;           // peer's latest reported frame
    this.rollbackTo = null;
    this.lastSent = -1; this.lastBits = -1; this.sinceSend = 0;
    this.myHash = new Map(); this.checked = new Set(); this.desync = false;
    this.stalls = 0; this.rollbacks = 0; this.skip = 0; this.ticks = 0;
    this.record = []; // confirmed [p0, p1] inputs per frame, for replays
    for (let f = 0; f < delay; f++) this.localIn.set(f, 0);
  }
  onInput(m) {
    this.remoteFrame = Math.max(this.remoteFrame, m.cf || 0);
    if (typeof m.a === "number") this.remoteAck = Math.max(this.remoteAck, m.a);
    // m.s = start frame, m.b = run-length [[bits,count],...]
    let f = m.s;
    for (const [bits, n] of m.b) {
      for (let k = 0; k < n; k++, f++) {
        if (f <= this.lastRemote || this.remoteIn.has(f)) continue; // already confirmed (redundant resend)
        this.remoteIn.set(f, bits);
        if (f < this.frame && this.used.get(f) !== bits) this.rollbackTo = this.rollbackTo === null ? f : Math.min(this.rollbackTo, f);
      }
    }
    while (this.remoteIn.has(this.lastRemote + 1)) this.lastRemote++;
  }
  onCheck(m) {
    const mine = this.myHash.get(m.f);
    if (mine !== undefined && mine !== m.h) { this.desync = true; console.warn("DESYNC at", m.f, mine, m.h); }
  }
  predict(f) {
    if (this.remoteIn.has(f)) return this.remoteIn.get(f);
    return this.lastRemote >= 0 ? this.remoteIn.get(this.lastRemote) : 0;
  }
  inputsFor(f) {
    const l = this.localIn.get(f) ?? 0, r = this.predict(f);
    this.used.set(f, r);
    return this.local === 0 ? [l, r] : [r, l];
  }
  send(force) {
    const top = this.frame + this.delay - 1; // newest local input frame scheduled
    const from = Math.max(this.remoteAck + 1, top - 40, 0);
    if (from > top) return;
    const b = [];
    for (let f = from; f <= top; f++) {
      const v = this.localIn.get(f) ?? 0;
      if (b.length && b[b.length - 1][0] === v) b[b.length - 1][1]++; else b.push([v, 1]);
    }
    this.net.send({ t: "in", s: from, b, a: this.lastRemote, cf: this.frame });
    this.lastSent = top; this.sinceSend = 0;
  }
  // returns array of events produced by newly simulated frame(s), or null when stalled
  tick(localBits, events) {
    this.ticks++;
    const tf = this.frame + this.delay;
    if (!this.localIn.has(tf)) this.localIn.set(tf, localBits);
    const changed = localBits !== this.lastBits; this.lastBits = localBits;
    this.sinceSend++;
    // direct link: send every frame (cheap, lowest latency). Relay: on change + every 3rd frame.
    if (changed || this.sinceSend >= (this.net.direct ? 1 : 3)) this.send();

    // 1) rollback & resimulate
    if (this.rollbackTo !== null) {
      const rf = this.rollbackTo; this.rollbackTo = null;
      const snap = this.snaps.get(rf);
      if (!snap) { this.desync = true; console.warn("rollback snapshot missing", rf); }
      else {
        this.rollbacks++;
        this.S = clone(snap);
        for (let f = rf; f < this.frame; f++) {
          this.snaps.set(f, clone(this.S));
          step(this.S, this.inputsFor(f), null);
        }
      }
    }
    // 2) time sync — if we're ahead of the peer, idle a frame now and then
    const adv = this.frame - this.remoteFrame - Math.round((this.net.peerRtt || 0) / 2 / 16.67);
    if (adv > 2 && this.ticks % 4 === 0) { this.skip++; return []; }
    // 3) stall if too far ahead of confirmed input
    if (this.frame - this.lastRemote > MAX_ROLLBACK) { this.stalls++; if (this.sinceSend > 0) this.send(); return null; }
    // 4) advance one frame
    this.snaps.set(this.frame, clone(this.S));
    step(this.S, this.inputsFor(this.frame), events);
    this.frame++;
    // desync checksums on confirmed frames
    const cf = Math.floor((Math.min(this.lastRemote, this.frame - 1) + 1) / 120) * 120;
    if (cf > 0 && !this.checked.has(cf) && this.snaps.has(cf)) {
      const h = hashState(this.snaps.get(cf)); this.myHash.set(cf, h); this.checked.add(cf); this.net.send({ t: "chk", f: cf, h });
    }
    // record confirmed frames (both inputs known) for replays
    while (this.record.length <= Math.min(this.lastRemote, this.frame - 1)) {
      const f = this.record.length, l = this.localIn.get(f) ?? 0, r = this.remoteIn.get(f) ?? 0;
      this.record.push(this.local === 0 ? [l, r] : [r, l]);
    }
    // prune
    const keep = Math.min(this.lastRemote, this.frame - 1) - 2;
    for (const k of this.snaps.keys()) if (k < keep - 120 || (k < keep && k % 120 !== 0)) this.snaps.delete(k);
    for (const k of this.used.keys()) if (k < keep) this.used.delete(k);
    for (const k of this.localIn.keys()) if (k < Math.min(keep, this.remoteAck) - 2) this.localIn.delete(k);
    for (const k of this.remoteIn.keys()) if (k < keep - 2) this.remoteIn.delete(k);
    return events;
  }
}
