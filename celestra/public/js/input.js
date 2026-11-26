// Keyboard / gamepad / touch -> per-player input bitmasks.
import { B } from "./sim.js";

const down = new Set();
const latched = new Set(); // taps shorter than one tick still count for one tick
const pressedOnce = new Set();
export const DEFAULT_BINDS = {
  p1: { L: ["KeyA"], R: ["KeyD"], U: ["KeyW"], D: ["KeyS"], A: ["KeyF"], P: ["KeyG"], S1: ["KeyR"], S2: ["KeyT"], S3: ["KeyY"], DASH: ["KeyH"], ST: ["KeyV"] },
  // extra keys for P1 when playing solo/online (right-hand layout)
  p1alt: { L: ["ArrowLeft"], R: ["ArrowRight"], U: ["ArrowUp", "Space"], D: ["ArrowDown"], A: ["KeyJ"], P: ["KeyK"], S1: ["KeyU"], S2: ["KeyI"], S3: ["KeyO"], DASH: ["KeyL"], ST: ["KeyP"] },
  p2: { L: ["ArrowLeft"], R: ["ArrowRight"], U: ["ArrowUp"], D: ["ArrowDown"], A: ["Numpad1", "KeyK"], P: ["Numpad2", "KeyL"], S1: ["Numpad4", "KeyI"], S2: ["Numpad5", "KeyO"], S3: ["Numpad6", "KeyP"], DASH: ["Numpad3", "Semicolon"], ST: ["Numpad0", "Quote"] },
};
// customizable controls (saved per browser)
function loadBinds() {
  const b = structuredClone(DEFAULT_BINDS);
  try { const saved = JSON.parse(localStorage.getItem("celestra:binds") || "null"); if (saved) for (const set of ["p1", "p2"]) for (const k in saved[set] || {}) if (b[set][k]) b[set][k] = saved[set][k]; } catch {}
  return b;
}
export let BINDS = loadBinds();
let GAME_KEYS = new Set();
function refreshKeys() { GAME_KEYS = new Set(Object.values(BINDS).flatMap((b) => Object.values(b).flat())); }
refreshKeys();
export function setBind(set, action, code) {
  // the chosen key replaces this action's primary key and is removed from other actions in the same set
  for (const k in BINDS[set]) BINDS[set][k] = BINDS[set][k].filter((c) => c !== code);
  BINDS[set][action] = [code, ...BINDS[set][action].slice(1).filter((c) => c !== code)];
  saveBinds();
}
export function resetBinds() { BINDS = structuredClone(DEFAULT_BINDS); saveBinds(); }
function saveBinds() {
  try { localStorage.setItem("celestra:binds", JSON.stringify({ p1: BINDS.p1, p2: BINDS.p2 })); } catch {}
  refreshKeys();
}
export function keyLabel(code) {
  if (!code) return "-";
  return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Numpad/, "NUM").replace("Arrow", "").replace("Semicolon", ";").replace("Quote", "'").replace("Space", "SPACE").replace("Comma", ",").replace("Period", ".").replace("Slash", "/").toUpperCase();
}
// capture the next key press (for remapping)
let captureFn = null;
export function captureKey(fn) { captureFn = fn; }

addEventListener("keydown", (e) => {
  if (captureFn) { e.preventDefault(); e.stopImmediatePropagation(); const f = captureFn; captureFn = null; f(e.code); return; }
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!down.has(e.code)) pressedOnce.add(e.code);
  down.add(e.code); latched.add(e.code);
});
addEventListener("keyup", (e) => down.delete(e.code));
addEventListener("blur", () => { down.clear(); latched.clear(); });

export function keyPressed(code) { const h = pressedOnce.has(code); pressedOnce.delete(code); return h; }
export function clearPressed() { pressedOnce.clear(); }

function fromBinds(b) {
  let v = 0;
  for (const k in b) if (b[k].some((c) => down.has(c) || latched.has(c))) v |= B[k];
  return v;
}

// touch buttons register here
export const touch = { bits: 0, latch: 0 };

function pad(i) {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  const g = gps && gps[i];
  if (!g) return 0;
  let v = 0;
  const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
  const b = (n) => g.buttons[n] && g.buttons[n].pressed;
  if (ax < -0.45 || b(14)) v |= B.L;
  if (ax > 0.45 || b(15)) v |= B.R;
  if (ay < -0.55 || b(12)) v |= B.U;
  if (ay > 0.55 || b(13)) v |= B.D;
  if (b(2)) v |= B.A;       // X / Square
  if (b(1)) v |= B.P;       // B / Circle
  if (b(0)) v |= B.S1;      // A / Cross
  if (b(3)) v |= B.S2;      // Y / Triangle
  if (b(5) || b(7)) v |= B.S3; // RB / RT
  if (b(4) || b(6)) v |= B.DASH; // LB / LT
  if (b(8) || b(10) || b(11)) v |= B.ST; // Back/Select or stick click = stance
  return v;
}

// mode: "solo" -> P1 gets both layouts + pad0 + touch; "local" -> split
export function readInputs(mode) {
  const out = mode === "local"
    ? [fromBinds(BINDS.p1) | pad(0) | touch.bits | touch.latch, fromBinds(BINDS.p2) | pad(1)]
    : [fromBinds(BINDS.p1) | fromBinds(BINDS.p1alt) | pad(0) | touch.bits | touch.latch, 0];
  latched.clear(); touch.latch = 0;
  return out;
}

export function setupTouch(root) {
  const active = new Map();
  const recompute = () => { let v = 0; for (const bit of active.values()) v |= bit; touch.bits = v; };
  // buttons
  root.querySelectorAll("[data-bit]").forEach((el) => {
    const bit = B[el.dataset.bit];
    const on = (e) => { e.preventDefault(); for (const t of e.changedTouches || [e]) active.set((t.identifier ?? "m") + el.dataset.bit, bit); el.classList.add("on"); recompute(); touch.latch |= bit; if (navigator.vibrate && touch.haptic) navigator.vibrate(6); };
    const off = (e) => { e.preventDefault(); for (const t of e.changedTouches || [e]) active.delete((t.identifier ?? "m") + el.dataset.bit); el.classList.remove("on"); recompute(); };
    el.addEventListener("touchstart", on, { passive: false });
    el.addEventListener("touchend", off, { passive: false });
    el.addEventListener("touchcancel", off, { passive: false });
    el.addEventListener("mousedown", on); el.addEventListener("mouseup", off); el.addEventListener("mouseleave", off);
  });
  // virtual thumbstick: direction from the touch point relative to the pad centre
  const pad = root.querySelector("#tpad"), knob = pad && pad.querySelector(".knob");
  if (!pad) return;
  let padId = null;
  const move = (t) => {
    const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    let dx = (t.clientX - cx) / R, dy = (t.clientY - cy) / R;
    const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
    let v = 0;
    if (dx < -0.35) v |= B.L; if (dx > 0.35) v |= B.R;
    if (dy < -0.5) v |= B.U; if (dy > 0.5) v |= B.D;
    const prev = active.get("pad") || 0;
    touch.latch |= v & ~prev;
    active.set("pad", v); recompute();
    knob.style.transform = `translate(${dx * 60}%, ${dy * 60}%)`;
  };
  const end = () => { padId = null; active.delete("pad"); recompute(); knob.style.transform = ""; };
  pad.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.changedTouches[0]; padId = t.identifier; move(t); }, { passive: false });
  pad.addEventListener("touchmove", (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === padId) move(t); }, { passive: false });
  pad.addEventListener("touchend", (e) => { for (const t of e.changedTouches) if (t.identifier === padId) end(); }, { passive: false });
  pad.addEventListener("touchcancel", end);
  let mouse = false;
  pad.addEventListener("mousedown", (e) => { mouse = true; move(e); });
  addEventListener("mousemove", (e) => { if (mouse) move(e); });
  addEventListener("mouseup", () => { if (mouse) { mouse = false; end(); } });
}
