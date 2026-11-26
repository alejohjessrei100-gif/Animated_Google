// Keyboard / gamepad / touch -> per-player input bitmasks.
import { B } from "./sim.js";

const down = new Set();
const latched = new Set(); // taps shorter than one tick still count for one tick
const pressedOnce = new Set();
export const BINDS = {
  p1: { L: ["KeyA"], R: ["KeyD"], U: ["KeyW"], D: ["KeyS"], A: ["KeyF"], P: ["KeyG"], S1: ["KeyR"], S2: ["KeyT"], S3: ["KeyY"], DASH: ["KeyH"] },
  // extra keys for P1 when playing solo/online (right-hand layout)
  p1alt: { L: ["ArrowLeft"], R: ["ArrowRight"], U: ["ArrowUp", "Space"], D: ["ArrowDown"], A: ["KeyJ"], P: ["KeyK"], S1: ["KeyU"], S2: ["KeyI"], S3: ["KeyO"], DASH: ["KeyL"] },
  p2: { L: ["ArrowLeft"], R: ["ArrowRight"], U: ["ArrowUp"], D: ["ArrowDown"], A: ["Numpad1", "KeyK"], P: ["Numpad2", "KeyL"], S1: ["Numpad4", "KeyI"], S2: ["Numpad5", "KeyO"], S3: ["Numpad6", "KeyP"], DASH: ["Numpad3", "Semicolon"] },
};
const GAME_KEYS = new Set(Object.values(BINDS).flatMap((b) => Object.values(b).flat()));

addEventListener("keydown", (e) => {
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
  const btns = root.querySelectorAll("[data-bit]");
  const active = new Map();
  const recompute = () => { let v = 0; for (const bit of active.values()) v |= bit; touch.bits = v; };
  btns.forEach((el) => {
    const bit = B[el.dataset.bit];
    const on = (e) => { e.preventDefault(); for (const t of e.changedTouches || [e]) active.set((t.identifier ?? "m") + el.dataset.bit, bit); el.classList.add("on"); recompute(); touch.latch |= bit; };
    const off = (e) => { e.preventDefault(); for (const t of e.changedTouches || [e]) active.delete((t.identifier ?? "m") + el.dataset.bit); el.classList.remove("on"); recompute(); };
    el.addEventListener("touchstart", on, { passive: false });
    el.addEventListener("touchend", off, { passive: false });
    el.addEventListener("touchcancel", off, { passive: false });
    el.addEventListener("mousedown", on); el.addEventListener("mouseup", off); el.addEventListener("mouseleave", off);
  });
}
