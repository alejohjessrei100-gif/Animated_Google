// Determinism + rollback-netcode tests (run: npm test)
import { newMatch, step, B, hashState, clone } from "../public/js/sim.js";
import { ROSTER } from "../public/js/chars.js";
import { RollbackSession } from "../public/js/net.js";
import assert from "node:assert/strict";

let seedI = 12345;
const r = () => (seedI = (seedI * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const BITS = [B.L, B.R, B.U, B.D, B.A, B.P, B.S1, B.S2, B.S3, B.DASH, B.ST];
const W = [0.35, 0.35, 0.08, 0.1, 0.3, 0.08, 0.06, 0.06, 0.05, 0.05, 0.03];
const randIn = (prev) => { if (r() < 0.85) return prev; let v = 0; BITS.forEach((b, i) => { if (r() < W[i]) v |= b; }); return v; };

// 1) every matchup is deterministic and clone/resume-equivalent
let kos = 0;
for (const a of ROSTER) for (const b of ROSTER) {
  const ins = []; let i0 = 0, i1 = 0;
  for (let f = 0; f < 5000; f++) { i0 = randIn(i0); i1 = randIn(i1); ins.push([i0, i1]); }
  const run = () => { const S = newMatch({ chars: [a, b], seed: 99 }); const ev = []; for (const x of ins) { step(S, x, ev); if (S.phase === "end") break; } return [S, ev]; };
  const [S1, ev1] = run(), [S2] = run();
  assert.equal(hashState(S1), hashState(S2), `nondeterministic ${a} v ${b}`);
  for (const f of S1.p) assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y), "NaN position");
  const S3 = newMatch({ chars: [a, b], seed: 99 }); let snap = null;
  for (let k = 0; k < ins.length; k++) { if (k === 1200) snap = clone(S3); step(S3, ins[k], null); if (S3.phase === "end") break; }
  for (let k = 1200; k < ins.length; k++) { step(snap, ins[k], null); if (snap.phase === "end") break; }
  assert.equal(hashState(S3), hashState(snap), `clone mismatch ${a} v ${b}`);
  kos += ev1.filter((e) => e.type === "ko").length;
}
console.log(`ok determinism: ${ROSTER.length ** 2} matchups, ${kos} KOs`);

// 2) two rollback sessions over a laggy, jittery (out-of-order) fake network must match
//    a ground-truth replay of the real inputs on every confirmed frame.
for (const [lat, jit] of [[1, 0], [4, 3], [8, 6], [12, 10]]) {
  const q = []; let now = 0;
  const mk = (to) => ({ send: (m) => q.push({ at: now + lat + Math.floor(r() * (jit + 1)), to, m: JSON.parse(JSON.stringify(m)) }), peerRtt: lat * 2 * 16.7 });
  const chars = ["jiross", "dapsay"];
  const sA = new RollbackSession(newMatch({ chars, seed: 7 }), 0, mk("B"), { delay: 2 });
  const sB = new RollbackSession(newMatch({ chars, seed: 7 }), 1, mk("A"), { delay: 2 });
  const hist = [new Map(), new Map()], seen = [new Map(), new Map()];
  let a = 0, b = 0;
  for (let t = 0; t < 2500; t++) {
    a = randIn(a); b = randIn(b);
    sA.tick(a, []); sB.tick(b, []);
    for (const [k, v] of sA.localIn) hist[0].set(k, v);
    for (const [k, v] of sB.localIn) hist[1].set(k, v);
    for (const [i, s] of [[0, sA], [1, sB]]) for (const [k, v] of s.snaps) if (k <= s.lastRemote) seen[i].set(k, hashState(v));
    now++;
    for (let i = q.length - 1; i >= 0; i--) if (q[i].at <= now) { const { to, m } = q.splice(i, 1)[0]; const s = to === "A" ? sA : sB; if (m.t === "in") s.onInput(m); else if (m.t === "chk") s.onCheck(m); }
  }
  const T = newMatch({ chars, seed: 7 });
  let compared = 0;
  const upto = Math.min(sA.lastRemote, sB.lastRemote);
  for (let f = 0; f < upto; f++) {
    const h = hashState(T);
    for (const i of [0, 1]) if (seen[i].has(f)) { assert.equal(seen[i].get(f), h, `side ${i} diverged at frame ${f} (lat ${lat})`); compared++; }
    step(T, [hist[0].get(f) ?? 0, hist[1].get(f) ?? 0], null);
  }
  assert.ok(!sA.desync && !sB.desync, "desync flagged");
  assert.ok(compared > upto, "too few frames compared");
  console.log(`ok rollback lat=${lat}f jitter=${jit}f: ${upto} frames verified vs ground truth, rollbacks ${sA.rollbacks}/${sB.rollbacks}, stalls ${sA.stalls}/${sB.stalls}`);
}
