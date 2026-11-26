// "How you invented the doorbell!" — OddTilt-format low-poly Short, 30fps, 1080x1920.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CamRig, Lights, V3} from './scene';
import {Wolf, Pose, walkPose} from './wolf';
import {Pig} from './pig';
import {Ground, House, HangingBell, BellBoard, SoundRings, Bolt, Wind, HangBellState, BoardState, BELL_X} from './set';
import {flashK, prog, clamp01, ease} from './lowpoly';
import {WORDS, TOTAL} from './timeline';
export {TOTAL};

// ---------------- key frames (from the voice timeline) ----------------
export const K = {
  knocks: [40, 47, 54, 84], blow: 134, doorFly: 141, genius1: 167, except1: 186, tase: 232, fall: 238,
  bell: 275, rope: 311, pull: 322, clever: 335, snap: 367, bellFall: 387, bonk: 397,
  button: 442, wireDraw: 449, battery: 466, wrap: 487, nail: 518, magnet: 557, hammer: 604, yank: 613, ding: 619, genius2: 638,
  except2: 657, onlyDing: 668, contact: 722, breaks: 748, buzz: 776, now: 830, hear: 858, duck: 892, lightsOff: 915,
};

// ---------------- camera shots (hard cuts; optional snappy ease-out move) ----------------
type Shot = {a: number; pos: V3; look: V3; fov?: number; to?: {pos: V3; look: V3; at: number; len: number}};
const SHOTS: Shot[] = [
  {a: 0, pos: [3.6, 1.5, 2.6], look: [-0.6, 1.2, 0.8], fov: 40, to: {pos: [2.6, 1.6, 2.1], look: [-0.2, 1.4, 0.6], at: 34, len: 10}},
  {a: 56, pos: [2.25, 1.55, 3.4], look: [1.9, 1.15, -2.2], fov: 30, to: {pos: [2.15, 1.5, 2.4], look: [1.9, 1.1, -2.2], at: 56, len: 8}},
  {a: 96, pos: [1.35, 1.95, 0.1], look: [-0.15, 1.75, 1.75], fov: 40, to: {pos: [1.05, 1.92, 0.4], look: [-0.15, 1.8, 1.75], at: 126, len: 8}},
  {a: 140, pos: [-3.9, 1.5, 3.4], look: [-0.1, 1.3, 0.75], fov: 40, to: {pos: [-2.9, 1.7, 3.5], look: [-0.15, 1.55, 1.6], at: 167, len: 8}},
  {a: 186, pos: [-4.4, 1.45, 1.3], look: [0.0, 1.15, 0.55], fov: 38},
  {a: 232, pos: [-2.7, 1.2, 1.4], look: [0.0, 0.95, 0.6], fov: 42},
  {a: 247, pos: [1.5, 1.9, 2.6], look: [-1.1, 2.0, 0.6], fov: 38, to: {pos: [0.9, 2.1, 2.1], look: [-1.1, 2.35, 0.5], at: 272, len: 8}},
  {a: 300, pos: [-0.15, 2.65, 1.25], look: [-1.1, 2.2, 0.5], fov: 38, to: {pos: [1.5, 1.8, 3.1], look: [-1.0, 1.75, 0.7], at: 335, len: 8}},
  {a: 352, pos: [1.9, 1.35, 3.4], look: [-1.0, 1.75, 0.7], fov: 38, to: {pos: [0.6, 1.8, 2.3], look: [-1.1, 1.95, 0.8], at: 398, len: 6}},
  {a: 423, pos: [-0.95, 1.62, 2.0], look: [-0.95, 1.62, 0], fov: 34},
  {a: 480, pos: [-1.16, 2.25, 0.95], look: [-1.16, 2.25, 0], fov: 34},
  {a: 539, pos: [-1.05, 2.22, 1.55], look: [-1.05, 2.22, 0], fov: 34},
  {a: 600, pos: [-1.04, 2.38, 1.0], look: [-1.04, 2.36, 0], fov: 34},
  {a: 636, pos: [-0.1, 1.7, 3.5], look: [-0.55, 1.6, 0.9], fov: 36, to: {pos: [-0.35, 1.8, 3.1], look: [-0.55, 1.7, 0.9], at: 638, len: 8}},
  {a: 657, pos: [0.4, 1.6, 5.2], look: [-0.2, 1.45, 0.3], fov: 40},
  {a: 704, pos: [-1.0, 2.15, 1.55], look: [-1.0, 2.15, 0], fov: 34},
  {a: 770, pos: [-1.02, 2.32, 0.95], look: [-1.02, 2.3, 0], fov: 34, to: {pos: [-0.95, 2.05, 1.9], look: [-0.95, 2.0, 0], at: 794, len: 8}},
  {a: 830, pos: [1.1, 1.7, 5.4], look: [0.7, 1.45, 0], fov: 40},
  {a: 880, pos: [2.55, 1.6, 2.3], look: [1.8, 1.35, -1.4], fov: 34, to: {pos: [1.0, 2.0, 6.6], look: [0.2, 1.5, 0], at: 908, len: 50}},
];

const camAt = (f: number) => {
  let s = SHOTS[0];
  for (const x of SHOTS) if (x.a <= f) s = x;
  if (!s.to) return {pos: s.pos, look: s.look, fov: s.fov ?? 36};
  const t = s.to.len > 20 ? clamp01((f - s.to.at) / s.to.len) : ease((f - s.to.at) / s.to.len); // long move = linear-ish pull back
  const k = s.to.len > 20 ? t * t * (3 - 2 * t) : t;
  const L = (a: V3, b: V3): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  return {pos: L(s.pos, s.to.pos), look: L(s.look, s.to.look), fov: s.fov ?? 36};
};
const shake = (f: number, at: number, len = 6, amp = 0.05): V3 => {
  const t = f - at; if (t < 0 || t > len) return [0, 0, 0];
  const k = (1 - t / len) * amp;
  return [Math.sin(t * 7.1) * k, Math.cos(t * 9.3) * k, 0];
};

// ---------------- wolf staging per frame ----------------
type WolfState = {pos: V3; rot: number; pose: Pose; tilt?: number};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const wolfAt = (f: number): WolfState => {
  const brace = f >= 247, bandage = f >= 423;
  const base = {brace, bandage};
  if (f < 96) {
    // walk to the door, then knock
    const t = clamp01(f / 34);
    const x = lerp(-2.8, -0.15, t), z = lerp(1.9, 1.05, t);
    if (f < 34) return {pos: [x, 0, z], rot: 1.86, pose: walkPose(f, 0.42, {briefcase: true})};
    const turn = prog(f, 34, 6);
    const kn = [40, 47, 54, 84].some((k) => f >= k - 3 && f < k) ? 0.35 : 0;
    return {pos: [-0.15, 0, 1.05], rot: lerp(1.86, Math.PI - 0.25, turn), pose: {briefcase: true, armL: [1.55 + kn, 0.05, 1.0 - kn], headNod: 0.05, brow: f > 60 ? 0.6 : 0, ears: f > 60 ? 0.4 : 0}};
  }
  if (f < 186) {
    // huff, puff, blow, genius
    const puff = f < K.blow ? prog(f, 106, 22) : Math.max(0, 1 - (f - K.blow) / 4);
    const blowing = f >= K.blow && f < 160;
    if (f < 167) return {pos: [-0.15, 0, 1.75], rot: Math.PI, pose: {briefcase: true, cheeks: puff, lean: blowing ? 0.25 : -puff * 0.15, jaw: blowing ? 1 : 0, eyes: puff > 0.5 ? 0.3 : 1, brow: -0.8, ears: blowing ? 1 : 0}};
    const t = prog(f, 167, 6);
    return {pos: [-0.15, 0, 1.75], rot: lerp(Math.PI, -0.75 + Math.PI * 2, t), pose: {briefcase: true, armL: [0.6, 0.3, 2.3], brow: -0.9, headTilt: 0.12, jaw: 0.25}};
  }
  if (f < 247) {
    // cop pig tases you
    const tased = f >= K.tase && f < K.fall + 2;
    const j = tased ? Math.sin(f * 3.3) * 0.05 : 0;
    const fallT = prog(f, K.fall, 8);
    return {pos: [-0.15 + j, 0, 1.05], rot: Math.PI, tilt: fallT * 1.55, pose: {
      briefcase: f < K.tase, armL: tased ? [0.4, 1.4 + j * 6, 0.2] : [0.05, 0.12, 0.15], armR: tased ? [0.4, 1.4 - j * 6, 0.2] : [0.05, 0.12, 0.15],
      jaw: tased ? 1 : f >= 200 ? 0.3 : 0, brow: f >= 200 ? 1 : 0, ears: f >= 200 ? 1 : 0, eyes: tased ? (f % 4 < 2 ? 1 : 0.2) : 1,
      hurt: flashK(f, K.tase, 12), dizzy: f >= K.fall + 6, cheeks: 0}};
  }
  if (f < 423) {
    // brass bell + rope; rope snaps; bell lands on your skull
    const p: Pose = {...base, brow: 0.2};
    if (f < 300) return {pos: [-0.55, 0, 1.2], rot: -0.35, pose: {...p, armL: [0.3, 1.1, 1.5], headTurn: f > 265 ? 0.5 : 0, brow: -0.4}};
    // stand under the bell, facing the wall, pull the rope
    let sw = 2.65;
    if (f >= K.pull && f < 333) sw = lerp(2.65, 2.25, Math.abs(Math.sin((f - K.pull) * 0.35)));
    if (f >= 356 && f < K.snap) sw = lerp(2.65, 2.0, prog(f, 356, 8));
    if (f >= K.snap) sw = lerp(2.0, 0.6, prog(f, K.snap, 6));
    const thumbs = f >= K.clever && f < 352;
    const bonk = f >= K.bonk;
    const wob = bonk ? Math.sin((f - K.bonk) * 0.5) * 0.12 : 0;
    return {pos: [BELL_X, 0, 0.95], rot: thumbs ? Math.PI - 0.9 : Math.PI, pose: {...p,
      armR: thumbs ? [0.05, 0.12, 0.15] : [sw, 0.15, 0.2], armL: thumbs ? [0.6, 0.3, 2.3] : [0.05, 0.12, 0.15],
      headTurn: thumbs ? -0.4 : 0, headNod: f >= K.snap && f < K.bonk ? -0.35 : 0, jaw: f >= K.snap && f < K.bonk ? 0.7 : 0,
      brow: thumbs ? -0.9 : f >= K.snap ? 1 : -0.2, ears: f >= K.snap ? 1 : 0, side: wob, kneeL: bonk ? 0.3 : 0, kneeR: bonk ? 0.3 : 0,
      hurt: Math.max(flashK(f, K.bonk, 12), flashK(f, 409, 10)), dizzy: f >= K.bonk + 4, eyes: f >= K.bonk && f < K.bonk + 4 ? 0 : 1, headTilt: wob}};
  }
  if (f < 636) return {pos: [0.9, 0, 1.6], rot: Math.PI, pose: {...base}};
  if (f < 657) {
    // GENIUS! thumbs up to camera
    return {pos: [-0.55, 0, 0.9], rot: -0.15, pose: {...base, armL: [0.6, 0.3, 2.3], brow: -0.9, headTilt: 0.12, jaw: 0.3}};
  }
  // pressing the button (side-on), deadpan
  const presses = f < 704 ? [665, 684, 694] : [740, 760, 776, 836, 846, 856, 866, 876, 890, 905, 920, 935];
  let press = 0;
  for (const pf of presses) if (f >= pf - 3 && f < pf + 4) press = 1;
  if (f >= 776 && f < 830) press = 1; // hold
  const lookCam = (f > 695 && f < 704) || f > 930;
  return {pos: [-0.05, 0, 0.5], rot: -Math.PI / 2 - 0.15, pose: {...base, armR: [1.05 + press * 0.25, 0.1, 0.3 - press * 0.3],
    headTurn: lookCam ? 1.1 : 0, brow: f > 930 ? 0.7 : f < 704 && f > 690 ? 0.5 : -0.3, ears: f > 930 ? 0.6 : 0, eyes: f > 930 ? 0.55 : 1}};
};

// is the doorbell button pressed right now?
const pressed = (f: number) => {
  const presses = f < 704 ? [665, 684, 694] : [740, 760, 836, 846, 856, 866, 876, 890, 905, 920, 935];
  for (const pf of presses) if (f >= pf - 3 && f < pf + 4) return 1;
  if (f >= 776 && f < 830) return 1;
  if (f >= 830) return 1;
  return 0;
};

// ---------------- props state ----------------
const hangBellAt = (f: number): HangBellState => {
  const show = f >= 247 && f < 423 ? 1 : 0;
  const swing = f >= K.pull && f < 352 ? Math.sin((f - K.pull) * 0.45) * 0.35 * Math.max(0, 1 - (f - K.pull) / 30) : 0;
  return {show, popAt: K.bell, flashBell: flashK(f, K.bell, 10), rope: f >= K.rope - 1 ? 1 : 0, ropePopAt: K.rope,
    flashRope: Math.max(flashK(f, K.rope, 10), flashK(f, K.snap, 10)), ropeRed: f >= K.snap ? flashK(f, K.snap, 10) : 0, swing,
    snapped: f >= K.snap, fall: prog(f, K.bellFall, 10)};
};

const boardAt = (f: number): BoardState => {
  const BIG = 1e9;
  let theta = -0.06, current = 0, spark = 0, ring = 0;
  const pr = pressed(f);
  if (f >= K.yank && f < 657) theta = lerp(-0.06, 0.08, clamp01((f - K.yank) / 4));
  if (f >= K.ding && f < K.ding + 20) ring = 1 - (f - K.ding) / 20;
  if (f >= 657 && f < 704) {
    // only dings once: first press yanks & sticks
    theta = f >= 665 ? 0.08 : -0.06;
    if (f >= 665 && f < 685) ring = 1 - (f - 665) / 20;
    current = f >= 661 && f < 668 ? 1 : 0;
  }
  if (f >= 557 && f < 657) current = 1;
  if (f >= 704 && f < 776) {
    // demo: press → current → yank → contact opens (spark) → spring back
    const cyc = [740, 760];
    theta = -0.06;
    for (const c of cyc) {
      if (f >= c - 3 && f < c + 3) current = 1;
      if (f >= c + 3 && f < c + 12) { theta = 0.08; if (f < c + 7) spark = 1 - (f - c - 3) / 4; ring = 0.6; }
    }
  }
  if (f >= 776) {
    // buzzing: alternate every frame
    const on = (f % 2) === 0;
    theta = on ? 0.08 : -0.06;
    current = on ? 0 : 1;
    spark = on ? 0.4 : 0;
    ring = 1;
  }
  const show = f >= 423;
  return {
    show, buttonAt: f >= K.button - 1 ? K.button : BIG, batteryAt: f >= K.battery - 1 ? K.battery : BIG,
    wire1: f >= 657 ? 1 : clamp01((f - K.wireDraw) / 20), coil: f >= 657 ? 1 : clamp01((f - K.wrap) / 28), nailAt: K.nail, hammerAt: K.hammer,
    contactAt: f >= 704 ? K.contact : BIG, wire34: f >= 539 ? 1 : 0,
    flashButton: flashK(f, K.button, 10), flashBattery: flashK(f, K.battery, 10), flashCoil: flashK(f, K.wrap, 10) + flashK(f, K.magnet, 12),
    flashNail: flashK(f, K.nail, 10), flashHammer: flashK(f, K.hammer, 10), flashContact: flashK(f, K.contact, 12),
    xray: f >= K.magnet && f < 640 ? 1 : 0, theta, current: f < 657 && f >= 557 ? current : current, field: f >= K.magnet && f < 640 ? 1 : 0,
    spark, pressed: pr, ring,
  };
};

// ---------------- captions ----------------
const SHOCK: Record<string, string> = {
  'down.': '#FFFFFF', 'blow': '#FFFFFF', 'genius!': '#FFD60A', 'clever!': '#FFD60A', 'felony,': '#FF3B30', 'tased.': '#FF3B30',
  'snaps,': '#FF3B30', 'skull.': '#FF3B30', 'electromagnet,': '#FFD60A', 'yanks': '#FFFFFF', 'once.': '#FF3B30', 'buzzes': '#FFFFFF',
  'not': '#FF3B30', 'home.': '#FF3B30', 'knock.': '#FFFFFF',
};
type Chunk = {a: number; b: number; start: number};
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: number[] = [];
  const flush = () => { if (cur.length) out.push({a: cur[0], b: cur[cur.length - 1], start: WORDS[cur[0]][1]}); cur = []; };
  WORDS.forEach((w, i) => {
    if (cur.length && (WORDS[cur[0]][3] !== w[3])) flush();
    cur.push(i);
    const last = /[,.!]$/.test(w[0]);
    const nextIsTiny = WORDS[i + 1] && WORDS[i + 1][0].length <= 2 && cur.length < 3;
    if (last || (cur.length >= 3 && !nextIsTiny) || cur.length >= 4) flush();
  });
  flush();
  return out;
})();

const Captions: React.FC<{f: number; width: number; height: number}> = ({f, width, height}) => {
  let ci = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (CHUNKS[i].start <= f) ci = i;
  if (ci < 0) return null;
  const c = CHUNKS[ci];
  const end = WORDS[c.b][2] + 12, next = CHUNKS[ci + 1]?.start ?? 1e9;
  if (f > Math.min(end, next)) return null;
  const k = width / 1080, t = f - c.start;
  const sc = t < 3 ? 0.6 + (t / 3) * 0.48 : t < 5 ? 1.08 - ((t - 3) / 2) * 0.08 : 1;
  const words = WORDS.slice(c.a, c.b + 1).map((w) => w[0]);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.65, transform: `translateY(-50%) scale(${sc})`, textAlign: 'center',
      fontFamily: '"Inter Black", "Inter", "Montserrat", "Arial Black", Impact, sans-serif', fontWeight: 900, fontSize: 92 * k, lineHeight: 1.05,
      padding: `0 ${70 * k}px`, textShadow: `0 ${6 * k}px ${10 * k}px rgba(0,0,0,0.45)`}}>
      {words.map((w, i) => {
        const key = w.toLowerCase(), col = SHOCK[key];
        return (
          <span key={i} style={{color: col ?? '#FFFFFF', WebkitTextStroke: `${12 * k}px #000`, paintOrder: 'stroke fill'}}>
            {col ? w.toUpperCase() : w}{i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

// ---------------- composition ----------------
export const Short: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cam = camAt(f);
  const sh = [shake(f, K.bonk, 7, 0.06), shake(f, K.tase, 10, 0.04), shake(f, K.doorFly, 6, 0.05)].reduce((a, b) => [a[0] + b[0], a[1] + b[1], 0] as V3);
  const w = wolfAt(f);
  const doorFly = f >= K.doorFly && f < 247 ? prog(f, K.doorFly, 14) : 0;
  const houseState = {doorAngle: 0, doorGone: false, doorFly, lightsOn: f >= K.lightsOff ? 0 : 1, planks: f >= 247};
  // pig on the sofa: zoned out with headphones → hears → ducks
  const pigY = f >= K.duck ? -prog(f, K.duck, 8) * 1.1 : 0;
  const pigHears = f >= K.hear;
  return (
    <AbsoluteFill style={{backgroundColor: '#BCD0E0'}}>
      <Audio src={staticFile('mix.wav')} />
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 36, near: 0.05, far: 200}}>
        <color attach="background" args={['#BCD0E0']} />
        <fog attach="fog" args={['#BCD0E0', 14, 40]} />
        <CamRig pos={[cam.pos[0] + sh[0], cam.pos[1] + sh[1], cam.pos[2]]} look={cam.look} fov={cam.fov} />
        <Lights at={[0, 0, 1]} />
        <Ground />
        <House s={houseState} />
        <HangingBell s={hangBellAt(f)} f={f} />
        <BellBoard s={boardAt(f)} f={f} />
        <group position={w.pos} rotation={[0, w.rot, 0]}>
          <group rotation={[-(w.tilt ?? 0), 0, 0]}>
            <Wolf pose={w.pose} />
          </group>
        </group>
        {/* the homeowner pig */}
        <Pig position={[1.9, 0.0 + pigY, -2.3]} rotation={pigHears ? 0 : -0.5}
          pose={{sit: true, headphones: !(f >= 862), bob: f < K.hear ? Math.abs(Math.sin(f * 0.35)) * 0.05 : 0, headNod: f < K.hear ? Math.sin(f * 0.35) * 0.12 : 0,
            armL: f >= 862 && f < K.duck ? 2.6 : 0.4, armR: 0.4, mouth: pigHears && f < K.duck ? 1 : 0, shirt: '#3FA7D6'}} />
        {/* cop pig */}
        {f >= K.except1 && f < 247 && (
          <Pig position={[0.1, 0, 0.2]} rotation={0} pose={{cop: true, taser: true, armR: f >= 222 ? 1.45 : 0.3, mouth: f >= 200 && f < 230 ? 0.6 : 0}} />
        )}
        {f >= K.tase && f < K.fall + 2 && <Bolt a={[-0.1, 1.22, 0.85]} b={[-0.15, 1.35, 0.95]} f={f} />}
        {/* knocks */}
        {K.knocks.map((k) => <SoundRings key={k} at={[0.05, 1.45, 0.06]} f={f} start={k} len={8} size={0.25} />)}
        {/* huff & puff wind */}
        <Wind from={[-0.15, 1.75, 1.25]} dir={[0, 0, -1]} f={f} start={K.blow} len={28} />
        {/* bell dings on the hanging bell */}
        <SoundRings at={[BELL_X, 2.35, 0.55]} f={f} start={326} len={16} size={0.8} color="#FFE08A" />
        <SoundRings at={[BELL_X, 2.0, 0.93]} f={f} start={K.bonk} len={14} size={0.6} color="#FF3B30" />
      </ThreeCanvas>
      <Captions f={f} width={width} height={height} />
    </AbsoluteFill>
  );
};
