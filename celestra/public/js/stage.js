// Parallax pixel-art stages, pre-rendered to offscreen layers.
import { VIEW_W, VIEW_H, STAGE_W } from "./sim.js";
export const FLOOR_Y = 238; // screen y of the ground line

function mk(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; }
function prng(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ordered-dither vertical gradient (classic 16-bit sky banding)
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function ditherGrad(ctx, x, y, w, h, cols) {
  const bands = cols.length - 1;
  for (let yy = 0; yy < h; yy++) {
    const t = (yy / h) * bands, i = Math.min(bands - 1, Math.floor(t)), k = t - i;
    for (let xx = 0; xx < w; xx += 1) {
      const th = (BAYER[yy & 3][xx & 3] + 0.5) / 16;
      ctx.fillStyle = k > th ? cols[i + 1] : cols[i];
      ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}
function ditherGradFast(ctx, x, y, w, h, cols) {
  // render one 4px-wide tile then repeat (dither pattern repeats every 4px)
  const [t, tx] = mk(4, h);
  ditherGrad(tx, 0, 0, 4, h, cols);
  for (let xx = 0; xx < w; xx += 4) ctx.drawImage(t, x + xx, y);
}

function skyline(ctx, w, baseY, rnd, col, winCol, minH, maxH, bw0, bw1, winChance = 0.35) {
  let x = 0;
  while (x < w) {
    const bw = Math.floor(bw0 + rnd() * (bw1 - bw0)), bh = Math.floor(minH + rnd() * (maxH - minH));
    ctx.fillStyle = col; ctx.fillRect(x, baseY - bh, bw, bh + 40);
    if (rnd() < 0.3) ctx.fillRect(x + Math.floor(bw / 2) - 1, baseY - bh - 6, 2, 6);
    if (winCol) for (let wy = baseY - bh + 4; wy < baseY - 2; wy += 5) for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
      if (rnd() < winChance) { ctx.fillStyle = winCol; ctx.fillRect(wx, wy, 2, 2); }
    }
    x += bw + Math.floor(rnd() * 3);
  }
}

export function buildStage(id) {
  const rnd = prng(id === "skyline" ? 7 : id === "arcade" ? 13 : 29);
  const layers = []; // {canvas, factor, y}
  const anim = []; // animated sprites
  if (id === "skyline") {
    const [sky, sx] = mk(VIEW_W, VIEW_H);
    ditherGradFast(sx, 0, 0, VIEW_W, 200, ["#0b0820", "#1b1145", "#3a1d6b", "#7a2f7a", "#d4587a"]);
    // pixel moon
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) { const d = x * x + y * y; if (d < 256) { sx.fillStyle = d > 220 ? "#e8d6b0" : (x + y > 8 ? "#e9dcbd" : "#fff4d6"); sx.fillRect(390 + x, 50 + y, 1, 1); } }
    sx.fillStyle = "#d9c69e"; sx.fillRect(384, 44, 4, 3); sx.fillRect(395, 56, 3, 3); sx.fillRect(398, 42, 2, 2);
    layers.push({ c: sky, f: 0, y: 0 });
    const stars = []; for (let i = 0; i < 70; i++) stars.push([Math.floor(rnd() * VIEW_W), Math.floor(rnd() * 130), rnd()]);
    anim.push({ type: "stars", stars });
    const [far, fx] = mk(STAGE_W, 200);
    skyline(fx, STAGE_W, 200, rnd, "#241a4a", "#4b3c82", 40, 90, 14, 30, 0.2);
    layers.push({ c: far, f: 0.15, y: 10 });
    const [mid, mx] = mk(STAGE_W + 200, 220);
    skyline(mx, STAGE_W + 200, 220, rnd, "#160f30", "#ffcf6b", 30, 110, 18, 44, 0.28);
    layers.push({ c: mid, f: 0.45, y: 12 });
    const [fl, flx] = mk(STAGE_W, VIEW_H - FLOOR_Y + 40);
    // rooftop floor
    flx.fillStyle = "#2a2338"; flx.fillRect(0, 0, STAGE_W, 60);
    flx.fillStyle = "#3a3150"; flx.fillRect(0, 0, STAGE_W, 3);
    flx.fillStyle = "#1c1727"; for (let x = 0; x < STAGE_W; x += 32) flx.fillRect(x, 3, 1, 60);
    for (let y = 10; y < 60; y += 9) { flx.fillStyle = "#231d30"; flx.fillRect(0, y, STAGE_W, 1); }
    // railing & vents
    const [fore, fox] = mk(STAGE_W, 60);
    for (let x = 0; x < STAGE_W; x += 96) { fox.fillStyle = "#3d3352"; fox.fillRect(x + 10, 20, 26, 18); fox.fillStyle = "#4e4268"; fox.fillRect(x + 10, 20, 26, 3); fox.fillStyle = "#1c1727"; for (let k = 0; k < 4; k++) fox.fillRect(x + 13 + k * 6, 26, 3, 10); }
    layers.push({ c: fore, f: 1, y: FLOOR_Y - 38, behind: true });
    layers.push({ c: fl, f: 1, y: FLOOR_Y, floor: true });
    anim.push({ type: "beacon", x: 120 }, { type: "beacon", x: 560 });
  } else if (id === "arcade") {
    const [sky, sx] = mk(VIEW_W, VIEW_H);
    ditherGradFast(sx, 0, 0, VIEW_W, 220, ["#05030c", "#120626", "#2a0b3d", "#43104c"]);
    layers.push({ c: sky, f: 0, y: 0 });
    const [far, fx] = mk(STAGE_W, 200);
    skyline(fx, STAGE_W, 200, rnd, "#1a0a2c", "#ff3fa4", 60, 140, 20, 40, 0.15);
    layers.push({ c: far, f: 0.2, y: 0 });
    const [mid, mx] = mk(STAGE_W + 160, 230);
    // arcade storefronts
    for (let x = 0; x < STAGE_W + 160; x += 120) {
      mx.fillStyle = "#170a24"; mx.fillRect(x, 80, 112, 150);
      mx.fillStyle = "#0d0616"; mx.fillRect(x + 8, 140, 96, 90);
      mx.fillStyle = "#2b1442"; for (let k = 0; k < 4; k++) mx.fillRect(x + 12 + k * 24, 150, 18, 60);
      mx.fillStyle = "#3cf2ff"; for (let k = 0; k < 4; k++) mx.fillRect(x + 14 + k * 24, 154, 14, 10);
    }
    layers.push({ c: mid, f: 0.5, y: 10 });
    anim.push({ type: "neon", signs: [[40, 96, "#ff3fa4", "ARCADE"], [280, 98, "#3cf2ff", "INSERT COIN"], [520, 96, "#ffe14d", "HI-SCORE"], [760, 98, "#5cff7a", "1UP"]] });
    const [fl, flx] = mk(STAGE_W, 70);
    for (let y = 0; y < 70; y += 8) for (let x = 0; x < STAGE_W; x += 16) { flx.fillStyle = ((x / 16 + y / 8) & 1) ? "#1d0f2d" : "#2a1640"; flx.fillRect(x, y, 16, 8); }
    flx.fillStyle = "#ff3fa4"; flx.fillRect(0, 0, STAGE_W, 1);
    layers.push({ c: fl, f: 1, y: FLOOR_Y, floor: true });
    anim.push({ type: "crowd", col: "#0a0412" });
  } else {
    // Batch 30 classroom
    const [sky, sx] = mk(VIEW_W, VIEW_H);
    sx.fillStyle = "#3b4a3a"; sx.fillRect(0, 0, VIEW_W, VIEW_H);
    layers.push({ c: sky, f: 0, y: 0 });
    const [wall, wx] = mk(STAGE_W + 120, 240);
    wx.fillStyle = "#6f8b6a"; wx.fillRect(0, 0, STAGE_W + 120, 240);
    wx.fillStyle = "#5d7859"; for (let y = 0; y < 240; y += 12) wx.fillRect(0, y, STAGE_W + 120, 1);
    wx.fillStyle = "#4b3a2a"; wx.fillRect(0, 196, STAGE_W + 120, 44);
    // windows with sunset
    for (let x = 30; x < STAGE_W + 120; x += 210) {
      wx.fillStyle = "#2e2a24"; wx.fillRect(x - 3, 37, 86, 86);
      ditherGrad(wx, x, 40, 80, 80, ["#ffb36b", "#ff7d6b", "#b35a8a"]);
      wx.fillStyle = "#2e2a24"; wx.fillRect(x + 38, 40, 4, 80); wx.fillRect(x, 78, 80, 4);
    }
    // chalkboard
    const bx = 250;
    wx.fillStyle = "#5a3d24"; wx.fillRect(bx - 4, 46, 228, 104);
    wx.fillStyle = "#1f3a2a"; wx.fillRect(bx, 50, 220, 96);
    wx.fillStyle = "#cfe3cf";
    const write = (t, x, y) => { for (let i = 0; i < t.length; i++) if (t[i] !== " ") wx.fillRect(x + i * 5, y, 3, 1 + ((i * 7) % 2)); };
    write("BATCH 30  CELESTRA", bx + 12, 62); write("F = G m1 m2 / r^2", bx + 12, 78); write("WAIT CLASS!!", bx + 12, 96);
    wx.fillStyle = "#e8e8e8"; wx.fillRect(bx + 150, 120, 50, 2); wx.fillRect(bx + 150, 108, 2, 14);
    layers.push({ c: wall, f: 0.55, y: 0 });
    const [fl, flx] = mk(STAGE_W, 70);
    for (let y = 0; y < 70; y += 6) for (let x = 0; x < STAGE_W; x += 24) { flx.fillStyle = ((x / 24 + y / 6) & 1) ? "#8a6a48" : "#7b5d3f"; flx.fillRect(x + ((y / 6) & 1) * 12, y, 24, 6); }
    flx.fillStyle = "#a88560"; flx.fillRect(0, 0, STAGE_W, 2);
    // desks in back row
    const [desks, dx] = mk(STAGE_W, 40);
    for (let x = 20; x < STAGE_W; x += 110) { dx.fillStyle = "#5e4228"; dx.fillRect(x, 10, 50, 5); dx.fillStyle = "#3a2817"; dx.fillRect(x + 3, 15, 3, 25); dx.fillRect(x + 44, 15, 3, 25); dx.fillStyle = "#8a8f9c"; dx.fillRect(x + 56, 4, 16, 3); dx.fillRect(x + 56, 4, 3, 36); }
    layers.push({ c: desks, f: 1, y: FLOOR_Y - 40, behind: true });
    layers.push({ c: fl, f: 1, y: FLOOR_Y, floor: true });
  }
  return { id, layers, anim };
}

export function drawStage(ctx, st, camX, time, font) {
  for (const L of st.layers) {
    if (L.floor) continue;
    const x = -Math.round(camX * L.f);
    ctx.drawImage(L.c, x, L.y);
    if (L === st.layers[0]) drawAnimBack(ctx, st, camX, time, font);
  }
  const fl = st.layers.find((l) => l.floor);
  if (fl) ctx.drawImage(fl.c, -Math.round(camX), fl.y);
}

function drawAnimBack(ctx, st, camX, time, font) {
  for (const a of st.anim) {
    if (a.type === "stars") {
      for (const [x, y, k] of a.stars) {
        const tw = Math.sin(time * 0.05 + k * 40) > 0.6;
        ctx.fillStyle = tw ? "#ffffff" : k > 0.5 ? "#9b8fd0" : "#5a4f90";
        ctx.fillRect(x, y, 1, 1);
        if (tw && k > 0.8) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
      }
    } else if (a.type === "neon") {
      for (const [x, y, c, txt] of a.signs) {
        const on = Math.sin(time * 0.07 + x) > -0.85;
        const sx = Math.round(x - camX * 0.5);
        if (sx < -120 || sx > 500) continue;
        ctx.fillStyle = "#12061c"; ctx.fillRect(sx - 3, y - 3, txt.length * 6 + 4, 12);
        font(ctx, txt, sx, y, on ? c : "#3a2450", 1);
      }
    } else if (a.type === "beacon") {
      if (Math.floor(time / 40) % 2) { ctx.fillStyle = "#ff3355"; ctx.fillRect(Math.round(a.x - camX * 0.45), 100, 2, 2); }
    }
  }
}

export function drawStageFront(ctx, st, camX, time) {
  for (const a of st.anim) {
    if (a.type === "crowd") {
      ctx.fillStyle = a.col;
      for (let x = -20; x < VIEW_W + 20; x += 14) {
        const wx = x + ((-camX * 1.25) % 14);
        const bob = Math.sin(time * 0.12 + x * 0.7) > 0.4 ? 2 : 0;
        ctx.fillRect(Math.round(wx), VIEW_H - 14 - bob, 10, 14 + bob);
        ctx.fillRect(Math.round(wx) + 2, VIEW_H - 20 - bob, 6, 6);
      }
    }
  }
}
