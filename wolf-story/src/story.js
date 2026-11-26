// ===================== characters, sets and the shot list =====================
const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); };
function hard(g, w, h) { const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); }
const add = (p, geo, m, x = 0, y = 0, z = 0, ry = 0) => { const o = new THREE.Mesh(geo.build ? geo.build() : geo, m); o.frustumCulled = false; o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o; };
const grp = (parent, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); parent.add(o); return o; };
const ring = (r, t, y, seg = 8) => new Geo().loft([{ y: y - t, rx: r, rz: r }, { y: y + t, rx: r, rz: r }], seg, { cap0: false, cap1: false });

// ---------- the wolf: the kit's presenter build, grey wolf in the ORIGINAL royal-blue suit ----------
const FUR = '#8d93a0', FUR2 = '#a0a6b2', FUR3 = '#727886', DARK = '#3b404c', DARK2 = '#4c525e', PALE = '#ece6da', PALE2 = '#d4cdc0', JKT = '#2457c5', JKT2 = '#183c8c', JKT3 = '#3a72e6', RED = '#e0262b';
function faceTex(eyes = 'open', brow = 0) {
  return tex(128, 64, (g, r) => {
    px(g, 0, 0, 128, 64, FUR); grain(g, r, 128, 64, 260, [FUR2, FUR3, FUR], 2);
    for (let i = 0; i < 46; i++) px(g, 66 + (r() * 60 | 0), (r() * 56) | 0, 1, 3 + (r() * 5 | 0), [FUR3, '#626877', FUR2][(r() * 3) | 0]);
    const m = (f) => { f(1); f(-1); }, X = (s, x) => 32 + s * x;
    m((s) => poly(g, [[X(s, 4), 46], [X(s, 16), 40], [X(s, 27), 38], [X(s, 32), 46], [X(s, 28), 58], [X(s, 14), 63], [X(s, 3), 63]], PALE));
    m((s) => { for (let i = 0; i < 5; i++) px(g, X(s, 26 + i) - (s < 0 ? 1 : 0), 47 + i * 2, 2, 2, i % 2 ? PALE2 : PALE); });
    poly(g, [[22, 0], [42, 0], [37, 14], [32, 24], [27, 14]], DARK2); poly(g, [[27, 0], [37, 0], [34, 10], [32, 16], [30, 10]], DARK);
    m((s) => px(g, X(s, 12) - 3, 16, 6, 3, PALE2));
    m((s) => {
      const cx = X(s, 13), x = cx - 4, y = 28;
      px(g, cx - 6, y - 3, 12, 11, DARK2);
      if (eyes === 'closed') { px(g, x, y + 4, 8, 2, DARK); px(g, x + (s > 0 ? 7 : -1), y + 3, 2, 1, DARK); return; }
      if (eyes === 'happy') { px(g, x, y + 5, 2, 2, '#fff3da'); px(g, x + 2, y + 3, 4, 2, '#fff3da'); px(g, x + 6, y + 5, 2, 2, '#fff3da'); return; }
      if (eyes === 'dizzy') { for (let k = 0; k < 7; k++) { px(g, x + k, y + k - 1, 2, 1, '#fff3da'); px(g, x + 6 - k, y + k - 1, 2, 1, '#fff3da'); } return; }
      const wide = eyes === 'wide', half = eyes === 'half';
      const rows = wide ? [4, 6, 8, 8, 9, 9, 9, 8, 8, 6, 4] : [4, 6, 8, 8, 8, 8, 8, 6, 4], oy = wide ? y - 2 : y - 1;
      rows.forEach((w, i) => { if (half && i < 4) return; px(g, cx - (w >> 1), oy + i, w, 1, '#fff3da'); });
      const irR = wide ? [2, 4, 4, 4, 2] : [4, 6, 6, 6, 6, 6, 4], iy = wide ? oy + 3 : oy + 1, ix = cx;
      irR.forEach((w, i) => { if (half && iy + i < oy + 4) return; px(g, ix - (w >> 1), iy + i, w, 1, wide ? '#17121c' : (i === 0 || i === 6) ? '#b86c10' : '#f2a51e'); });
      if (!wide) [2, 4, 4, 4, 2].forEach((w, i) => { if (half && iy + 1 + i < oy + 4) return; px(g, ix - (w >> 1), iy + 1 + i, w, 1, '#17121c'); });
      px(g, ix - (wide ? 1 : 2), iy + (half ? 3 : 1), wide ? 1 : 2, wide ? 1 : 2, '#fff');
      if (half) px(g, cx - 4, oy + 3, 8, 1, DARK);
    });
    m((s) => { const x = X(s, 13); for (let i = -5; i <= 5; i++) px(g, x + i, Math.round(21 + brow * s * i * -.35 + (eyes === 'wide' ? -3 : 0)), 1, 2, '#2f333d'); });
    hard(g, 128, 64);
  }, 11);
}
const FACES = {}; const face = (k) => FACES[k] || (FACES[k] = faceTex(...({ open: ['open', 0], closed: ['closed', 0], half: ['half', .6], wide: ['wide', -.3], happy: ['happy', -.5], smug: ['half', -.5], cross: ['open', .9], dizzy: ['dizzy', .6] }[k] || [k, 0])));
const muzT = tex(64, 32, (g, r) => { px(g, 0, 0, 64, 32, PALE); px(g, 0, 0, 64, 13, FUR); grain(g, r, 64, 13, 40, [FUR2, FUR3], 2); grain(g, r, 64, 19, 40, [PALE2, '#f6f1e9'], 2, 0, 13); px(g, 30, 13, 4, 19, '#8d8478'); for (const [x, y] of [[20, 18], [24, 22], [18, 24], [44, 18], [40, 22], [46, 24]]) px(g, x, y, 1, 1, DARK); }, 3);
const earT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, FUR3); grain(g, r, 32, 32, 40, [FUR, DARK2], 2); poly(g, [[7, 32], [25, 32], [16, 8]], '#e0b4b0'); poly(g, [[11, 32], [21, 32], [16, 17]], '#c38d8c'); px(g, 12, 0, 8, 6, DARK); hard(g, 32, 32); }, 4);
const bodyT = tex(128, 64, (g, r) => {
  px(g, 0, 0, 128, 64, JKT); grain(g, r, 128, 64, 260, [JKT2, JKT3, JKT], 2);
  for (const x of [8, 56, 72, 120]) px(g, x, 0, 1, 64, JKT2);
  poly(g, [[22, 0], [42, 0], [38, 44], [32, 54], [26, 44]], '#f4f4f0'); grain(g, r, 10, 40, 14, ['#dcdcd6'], 1, 27, 2);
  poly(g, [[18, 0], [23, 0], [33, 50], [28, 46], [20, 24], [15, 18]], JKT2); poly(g, [[46, 0], [41, 0], [31, 50], [36, 46], [44, 24], [49, 18]], JKT2);
  px(g, 31, 50, 2, 14, JKT2); px(g, 34, 53, 2, 2, '#0e1f4d'); px(g, 34, 59, 2, 2, '#0e1f4d'); px(g, 10, 46, 11, 2, JKT2); px(g, 43, 46, 11, 2, JKT2); px(g, 44, 26, 7, 1, JKT2); px(g, 46, 23, 4, 3, RED);
  px(g, 95, 0, 2, 64, JKT2); hard(g, 128, 64);
}, 5);
const slvT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, JKT); grain(g, r, 32, 32, 60, [JKT2, JKT3], 2); px(g, 0, 27, 32, 2, JKT2); px(g, 0, 29, 32, 3, '#f4f4f0'); }, 6);
const pantT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#1f4cb0'); grain(g, r, 32, 32, 50, [JKT2, '#2a5bc8'], 2); px(g, 15, 0, 1, 32, JKT2); }, 8);
const tieT = tex(16, 32, (g) => { px(g, 0, 0, 16, 32, RED); px(g, 0, 0, 16, 2, '#b81c20'); px(g, 7, 0, 2, 32, '#f0464a'); }, 9);
const tailT = tex(32, 64, (g, r) => { px(g, 0, 0, 32, 64, FUR2); grain(g, r, 32, 64, 120, [FUR, FUR3, '#b0b6c0'], 2); px(g, 0, 0, 32, 12, DARK); px(g, 0, 12, 32, 4, DARK2); }, 10);
const pawT = tex(16, 16, (g, r) => { px(g, 0, 0, 16, 16, DARK); grain(g, r, 16, 16, 20, [DARK2, '#2a2e36'], 1); px(g, 4, 0, 1, 6, '#22262e'); px(g, 8, 0, 1, 6, '#22262e'); px(g, 12, 0, 1, 6, '#22262e'); }, 12);
const caseT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#8b4a22'); grain(g, r, 32, 32, 40, ['#7a3f1c', '#9c5a2e'], 2); px(g, 0, 9, 32, 2, '#5c2e14'); px(g, 6, 8, 4, 4, '#e8c34a'); px(g, 22, 8, 4, 4, '#e8c34a'); }, 13);
const gauzeT = tex(16, 16, (g, r) => { px(g, 0, 0, 16, 16, '#f4f0e6'); grain(g, r, 16, 16, 30, ['#e2dccd', '#ffffff'], 1); }, 14);

const REST = { x: 0, y: 0, z: 0, ry: 0, rx: 0, rz: 0, sq: 1, hip: 0, tw: 0, lean: 0, side: 0, hx: 0, hy: 0, hz: 0, lz: .16, lx: 0, le: -.25, ly: 0, rz_: .16, rx_: 0, re: -.25, ry_: 0, lh: 0, rh: 0, ll: 0, rl: 0, jaw: 0, tail: 0, ear: 0, face: 'open', puff: 0 };
function makeWolf() {
  const root = new THREE.Group(), mats = []; let tris = 0;
  const M = (o) => { const m = mat({ affine: .6, ...o }); mats.push(m); return m; };
  const ad = (parent, geo, m, pos) => { tris += geo.tris; const o = new THREE.Mesh(geo.build(17 + mats.length), m); o.frustumCulled = false; if (pos) o.position.set(...pos); parent.add(o); return o; };
  const mBody = M({ map: bodyT, color: 0x2457c5 }), mFace = M({ map: face('open'), color: 0x8d93a0 }), mMuz = M({ map: muzT, color: 0xece6da, affine: 0 }), mEar = M({ map: earT, color: 0x727886 }), mSlv = M({ map: slvT, color: 0x2457c5 }), mPant = M({ map: pantT, color: 0x1f4cb0 }), mPaw = M({ map: pawT, color: 0x3b404c }), mTie = M({ map: tieT, color: 0xe0262b }), mTail = M({ map: tailT, color: 0x8d93a0 }), mIn = M({ color: 0x7a2432 }), mNose = M({ color: 0x15131a }), mCase = M({ map: caseT, color: 0x8b4a22 }), mGauze = M({ map: gauzeT, color: 0xf4f0e6 });
  const bod = grp(root, 0, .52, 0);
  ad(bod, new Geo().loft([{ y: -.02, rx: .30, rz: .24 }, { y: .16, rx: .37, rz: .30 }, { y: .40, rx: .33, rz: .26 }, { y: .60, rx: .21, rz: .17 }], 6, { map: 'face', rot: Math.PI / 6, cap1: false }), mBody);
  ad(bod, new Geo().hexa((x, y, z) => [x * (y > 0 ? .035 : .062), y > 0 ? .56 : .22, (y > 0 ? .19 : .315) + z * .012], { back: null, left: null, right: null, top: null, bottom: null }), mTie);
  const leg = (s) => { const g = grp(bod, s * .155, .02, 0); ad(g, new Geo().loft([{ y: -.40, rx: .105, rz: .105 }, { y: 0, rx: .15, rz: .15 }], 4, { rot: Math.PI / 4, cap0: false, cap1: false }), mPant); ad(g, new Geo().hexa((x, y, z) => [x * (z > 0 ? .13 : .10), -.45 + y * (z > 0 ? .055 : .07), .06 + z * .17]), mNose); return g; };
  const LL = leg(-1), RL = leg(1);
  const neck = grp(bod, 0, .56, 0), head = grp(neck, 0, .02, 0);
  const brace = ad(neck, ring(.2, .07, .02, 6), mGauze);
  ad(head, new Geo().loft([{ y: -.03, rx: .17, rz: .17 }, { y: .14, rx: .42, rz: .32 }, { y: .30, rx: .48, rz: .36 }, { y: .52, rx: .40, rz: .34 }, { y: .66, rx: .22, rz: .20 }], 8, { map: 'face', rot: Math.PI / 8, box: { x: .48, y0: -.03, y1: .66 }, cap0: false }), mFace);
  ad(head, new Geo().hexa((x, y, z) => z > 0 ? [x * (y > 0 ? .06 : .09), .175 + y * .055, .72] : [x * (y > 0 ? .12 : .20), .17 + (y > 0 ? .14 : -.05), .30], { back: null }), mMuz);
  ad(head, new Geo().hexa((x, y, z) => [x * (z > 0 ? .04 : .075) * (y > 0 ? 1.15 : .7), .215 + y * (z > 0 ? .026 : .045), .745 + z * .05], { back: null }), mNose);
  const band = grp(head); ad(band, ring(.45, .045, .5, 6), mGauze); ad(band, new Geo().quad([.02, .58, .3], [.22, .58, .27], [.22, .7, .25], [.02, .7, .28]), mGauze);
  const jaw = grp(head, 0, .13, .30); ad(jaw, new Geo().hexa((x, y, z) => z > 0 ? [x * .065, -.01 + y * .022, .36] : [x * .14, -.02 + y * .045, 0], { back: null, top: null }), mMuz);
  ad(jaw, new Geo().hexa((x, y, z) => z > 0 ? [x * .05, .02 + y * .004, .34] : [x * .11, .03 + y * .004, .02], { left: null, right: null, bottom: null, back: null, front: null }), mIn);
  const ear = (s) => { const g = grp(head, s * .29, .55, -.03); ad(g, new Geo().tri([-.14, -.06, .07], [.14, -.06, .07], [s * .03, .44, 0], [0, 0], [1, 0], [.5, 1]).tri([.14, -.06, .07], [.12, -.06, -.10], [s * .03, .44, 0]).tri([.12, -.06, -.10], [-.12, -.06, -.10], [s * .03, .44, 0], [0, .9], [.05, .9], [0, 1]).tri([-.12, -.06, -.10], [-.14, -.06, .07], [s * .03, .44, 0]), mEar); return g; };
  const EL = ear(-1), ER = ear(1);
  const arm = (s) => {
    const sh = grp(bod, s * .20, .52, 0); ad(sh, new Geo().loft([{ y: -.30, rx: .095, rz: .095 }, { y: .03, rx: .115, rz: .115 }], 4, { rot: Math.PI / 4, cap0: false, cap1: false, vr: [.3, 1] }), mSlv);
    const el = grp(sh, 0, -.29, 0); ad(el, new Geo().loft([{ y: -.26, rx: .085, rz: .085 }, { y: .01, rx: .095, rz: .095 }], 4, { rot: Math.PI / 4, cap0: false, cap1: false, vr: [0, .7] }), mSlv);
    const hd = grp(el, 0, -.26, 0); ad(hd, new Geo().hexa((x, y, z) => [x * (y > 0 ? .075 : .10), -.08 + y * .09, z * (y > 0 ? .06 : .05)]), mPaw); ad(hd, new Geo().tri([-s * .06, -.01, .05], [-s * .06, -.10, .05], [-s * .16, -.07, .03]).tri([-s * .06, -.01, -.02], [-s * .06, -.10, -.02], [-s * .16, -.07, .03]).tri([-s * .06, -.01, .05], [-s * .06, -.01, -.02], [-s * .16, -.07, .03]).tri([-s * .06, -.10, .05], [-s * .06, -.10, -.02], [-s * .16, -.07, .03]), mPaw);
    return { sh, el, hd };
  };
  const AL = arm(-1), AR = arm(1);
  const bcase = grp(AR.hd, 0, -.14, 0); ad(bcase, new Geo().box(.12, .34, .46, 0, -.17, 0), mCase);
  const tailG = new Geo(), tm = new THREE.Mesh(new THREE.BufferGeometry(), mTail); tm.frustumCulled = false; bod.add(tm);
  function tailAt(sw, lift) {
    tailG.p.length = 0; tailG.uv.length = 0; const R = [.08, .16, .21, .22, .17, .04], n = 6, S = 4, P = [];
    let x = 0, y = .10, z = -.24, a = -1.25, b = 0;
    for (let i = 0; i < n; i++) { P.push({ x, y, z, a, b, r: R[i] }); a += .26 + lift * .12; b += sw * .22; const L = .21; x += Math.sin(b) * L; y += Math.sin(a) * L * .9; z -= Math.cos(a) * L * .8; }
    const pt = (q, j) => { const t = j / S * Math.PI * 2 + Math.PI / 4; return [q.x + Math.cos(t) * q.r, q.y + Math.sin(t) * q.r * Math.cos(q.a), q.z + Math.sin(t) * q.r * Math.sin(q.a)]; };
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < S; j++) tailG.quad(pt(P[i], j), pt(P[i], j + 1), pt(P[i + 1], j + 1), pt(P[i + 1], j), [j / S, i / 5], [(j + 1) / S, i / 5], [(j + 1) / S, (i + 1) / 5], [j / S, (i + 1) / 5]);
    tailG.fill(tm.geometry, 99);
  }
  tailAt(0, 0); tris += tailG.tris;
  function pose(q) {
    const p = { ...REST, ...q };
    root.position.set(p.x, p.y, p.z); root.rotation.set(p.rx, p.ry, p.rz); root.scale.set(1 / Math.sqrt(p.sq), p.sq, 1 / Math.sqrt(p.sq));
    bod.position.y = .52 + p.hip; bod.rotation.set(p.lean, p.tw, p.side); head.rotation.set(p.hx, p.hy, p.hz);
    AL.sh.rotation.set(p.lx, p.ly, -p.lz); AL.el.rotation.set(p.le, 0, 0); AL.hd.rotation.set(p.lh, 0, 0);
    AR.sh.rotation.set(p.rx_, p.ry_, p.rz_); AR.el.rotation.set(p.re, 0, 0); AR.hd.rotation.set(p.rh, 0, 0);
    LL.rotation.set(p.ll - p.lean, 0, -p.side); RL.rotation.set(p.rl - p.lean, 0, -p.side); jaw.rotation.x = p.jaw * .55; EL.rotation.set(p.ear, 0, .16 + (p.earT || 0)); ER.rotation.set(p.ear, 0, -.16 - (p.earT2 || 0));
    head.scale.set(1 + p.puff * .22, 1 - p.puff * .05, 1 + p.puff * .1);
    brace.visible = !!p.brace; band.visible = !!p.bandage; bcase.visible = !!p.case;
    tailAt(p.tail, p.tl || 0); mFace.uniforms.map.value = face(p.face);
    root.updateMatrixWorld(true);
  }
  const set = (k, v) => { for (const m of mats) m.uniforms[k].value = v; };
  pose({});
  return { root, pose, set, head, get tris() { return tris; } };
}

// ---------- the pigs: same kit build (pear body, 8-sided head, box snout, rigid joints) ----------
const PIG = '#f59ab0', PIG2 = '#e47d97', PIG3 = '#fbb6c6';
function pigFace(eyes) {
  return tex(128, 64, (g, r) => {
    px(g, 0, 0, 128, 64, PIG); grain(g, r, 128, 64, 200, [PIG2, PIG3], 2);
    const m = (f) => { f(1); f(-1); }, X = (s, x) => 32 + s * x;
    m((s) => {
      const cx = X(s, 12), y = 26;
      if (eyes === 'closed') { px(g, cx - 4, y + 3, 8, 2, '#5a2a36'); return; }
      const wide = eyes === 'wide', h = wide ? 9 : 6, w = wide ? 8 : 6;
      px(g, cx - (w >> 1), y - (wide ? 2 : 0), w, h, '#fff6f0'); px(g, cx - 2, y + (wide ? 1 : 1), 4, wide ? 5 : 4, '#1a1218'); px(g, cx - 2, y + 1, 1, 1, '#fff');
      for (let i = -4; i <= 4; i++) px(g, cx + i, Math.round(y - 5 + (wide ? -2 : 0) + s * i * (eyes === 'cop' ? .35 : 0)), 1, 2, '#c45a78');
    });
    m((s) => px(g, X(s, 22) - 3, 38, 6, 3, '#ff8fa8'));
    hard(g, 128, 64);
  }, 41);
}
const PF = {}; const pigF = (k) => PF[k] || (PF[k] = pigFace(k));
const snoutT = tex(32, 32, (g) => { px(g, 0, 0, 32, 32, PIG3); px(g, 0, 0, 32, 3, PIG2); px(g, 8, 12, 5, 9, '#b8506c'); px(g, 19, 12, 5, 9, '#b8506c'); }, 42);
const shirtT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#3fa7d6'); for (let y = 0; y < 64; y += 8) px(g, 0, y, 64, 3, '#5bbbe6'); grain(g, r, 64, 64, 60, ['#3393bf'], 2); }, 43);
const copT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#2b3f73'); grain(g, r, 64, 64, 80, ['#24365f', '#34498a'], 2); px(g, 22, 14, 5, 6, '#f2c230'); px(g, 31, 0, 2, 64, '#1e2a4a'); }, 44);
function makePig({ cop = false } = {}) {
  const root = new THREE.Group(), mats = [];
  const M = (o) => { const m = mat({ affine: .6, ...o }); mats.push(m); return m; };
  const mBody = M({ map: cop ? copT : shirtT, color: 0x3fa7d6 }), mSkin = M({ color: 0xf59ab0 }), mFace = M({ map: pigF(cop ? 'cop' : 'open'), color: 0xf59ab0 }), mSn = M({ map: snoutT, color: 0xfbb6c6, affine: 0 }), mHoof = M({ color: 0x5a3a3a }), mLeg = M({ color: cop ? 0x1e2a4a : 0xf59ab0 }), mBlack = M({ color: 0x222226 }), mRed = M({ color: 0xff3b30 }), mHat = M({ color: 0x1e2a4a }), mGold = M({ color: 0xf2c230, em: .3 }), mYel = M({ color: 0xffd60a });
  const bod = grp(root, 0, .48, 0);
  add(bod, new Geo().loft([{ y: -.02, rx: .36, rz: .30 }, { y: .2, rx: .42, rz: .36 }, { y: .44, rx: .36, rz: .30 }, { y: .58, rx: .2, rz: .18 }], 6, { map: 'face', rot: Math.PI / 6 }), mBody);
  const leg = (s) => { const g = grp(bod, s * .17, .02, 0); add(g, new Geo().loft([{ y: -.42, rx: .1, rz: .1 }, { y: 0, rx: .14, rz: .14 }], 4, { rot: Math.PI / 4, cap0: false }), mLeg); add(g, new Geo().box(.18, .08, .2, 0, -.45, .02), mHoof); return g; };
  const LL = leg(-1), RL = leg(1);
  const head = grp(bod, 0, .56, .02);
  add(head, new Geo().loft([{ y: 0, rx: .2, rz: .2 }, { y: .14, rx: .44, rz: .36 }, { y: .34, rx: .46, rz: .38 }, { y: .52, rx: .36, rz: .30 }, { y: .62, rx: .18, rz: .16 }], 8, { map: 'face', rot: Math.PI / 8, box: { x: .46, y0: 0, y1: .62 }, cap0: false }), mFace);
  add(head, new Geo().box(.3, .2, .14, 0, .2, .42), mSn);
  const jaw = add(head, new Geo().box(.2, .04, .04, 0, .06, .36), mBlack);
  const ear = (s) => { const g = grp(head, s * .28, .52, 0); add(g, new Geo().tri([-.12, 0, .05], [.12, 0, .05], [s * .1, .2, .2]).tri([.12, 0, -.05], [-.12, 0, -.05], [s * .1, .2, .2]).tri([-.12, 0, .05], [-.12, 0, -.05], [s * .1, .2, .2]).tri([.12, 0, -.05], [.12, 0, .05], [s * .1, .2, .2]), mSkin); return g; };
  ear(-1); ear(1);
  const arm = (s) => { const sh = grp(bod, s * .38, .42, 0); add(sh, new Geo().loft([{ y: -.36, rx: .08, rz: .08 }, { y: .02, rx: .1, rz: .1 }], 4, { rot: Math.PI / 4, cap0: false }), mBody); add(sh, new Geo().box(.14, .12, .12, 0, -.42, 0), mSkin); return sh; };
  const AL = arm(-1), AR = arm(1);
  const phones = grp(head); add(phones, new Geo().box(.9, .06, .1, 0, .6, 0), mBlack); for (const s of [-1, 1]) { add(phones, new Geo().box(.06, .3, .08, s * .45, .45, 0), mBlack); add(phones, new Geo().box(.12, .24, .24, s * .46, .3, 0), mRed); }
  const hat = grp(head); if (cop) { add(hat, new Geo().loft([{ y: .56, rx: .3, rz: .28 }, { y: .74, rx: .34, rz: .32 }, { y: .76, rx: .1, rz: .1 }], 8), mHat); add(hat, new Geo().box(.5, .03, .22, 0, .56, .28), mBlack); add(hat, new Geo().box(.1, .1, .03, 0, .66, .33), mGold); }
  const taser = grp(AR, 0, -.48, .06); if (cop) { add(taser, new Geo().box(.1, .12, .26, 0, 0, .1), mYel); add(taser, new Geo().box(.06, .06, .06, 0, 0, .25), mBlack); }
  const tailG = new Geo(); for (let i = 0; i < 4; i++) { const a = i * 1.6, b = (i + 1) * 1.6; tailG.quad([Math.cos(a) * .06, .15 + i * .02, -.32 - i * .03], [Math.cos(b) * .06, .15 + (i + 1) * .02, -.32 - (i + 1) * .03], [Math.cos(b) * .06, .19 + (i + 1) * .02, -.32 - (i + 1) * .03], [Math.cos(a) * .06, .19 + i * .02, -.32 - i * .03]); } add(bod, tailG, mSkin);
  function pose(q) {
    const p = { x: 0, y: 0, z: 0, ry: 0, sit: 0, la: .15, ra: .15, hx: 0, hy: 0, bob: 0, mouth: 0, face: 'open', phones: false, ...q };
    root.position.set(p.x, p.y, p.z); root.rotation.set(0, p.ry, 0);
    bod.position.y = .48 + p.bob - p.sit * .02; LL.rotation.x = RL.rotation.x = -p.sit * 1.45;
    AL.rotation.set(-p.la, 0, -.3); AR.rotation.set(-p.ra, 0, .3); head.rotation.set(p.hx, p.hy, 0);
    jaw.scale.set(1, 1 + p.mouth * 3, 1); phones.visible = p.phones; mFace.uniforms.map.value = pigF(p.face === 'open' && cop ? 'cop' : p.face);
    root.updateMatrixWorld(true);
  }
  pose({});
  return { root, pose, set: (k, v) => mats.forEach((m) => m.uniforms[k].value = v) };
}

// ---------- the set: the pigs' brick house, front yard, the cut ground ----------
const grassT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#7db347'); grain(g, r, 64, 64, 420, ['#8bc152', '#6fa33e', '#99cf5c', '#65973a'], 2); for (let i = 0; i < 46; i++) { const x = r() * 62 | 0, y = r() * 58 | 0; px(g, x, y, 1, 4, '#aadb68'); px(g, x + 1, y + 2, 1, 3, '#5a8a36'); } }, 21);
const strataT = tex(128, 64, (g, r) => {
  for (const [a, b, c] of [[0, 5, '#5c8a3a'], [5, 10, '#4a3626'], [10, 26, '#7a5436'], [26, 40, '#946a44'], [40, 52, '#6f5a4e'], [52, 64, '#544a4a']]) px(g, 0, a, 128, b - a, c);
  for (let x = 0; x < 128; x++) { px(g, x, 4 + (r() * 4 | 0), 1, 3, '#4f7a33'); px(g, x, 25 + (Math.sin(x * .13) * 2 | 0), 1, 2, '#6a4a30'); px(g, x, 39 + (Math.sin(x * .09 + 1) * 2 | 0), 1, 2, '#5c4a40'); }
  grain(g, r, 128, 48, 320, ['rgba(0,0,0,.16)', 'rgba(255,235,200,.12)'], 2, 0, 10);
  for (let i = 0; i < 26; i++) { const x = r() * 124 | 0, y = 14 + (r() * 46 | 0), w = 2 + (r() * 5 | 0); px(g, x, y, w, 2 + (r() * 3 | 0), ['#8d8580', '#a49a90', '#756c68'][r() * 3 | 0]); px(g, x, y, w, 1, '#b9aea2'); }
  px(g, 60, 30, 3, 26, '#d9822b'); px(g, 60, 30, 20, 3, '#d9822b'); // the doorbell's buried wire
}, 22);
const brickT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#c9bfb0'); for (let y = 0; y < 64; y += 8) for (let x = -8; x < 64; x += 16) px(g, x + ((y / 8) % 2) * 8 + 1, y + 1, 14, 6, ['#b0705c', '#a6654f', '#bb7a64', '#9c5c4a'][r() * 4 | 0]); grain(g, r, 64, 64, 60, ['rgba(60,20,10,.15)'], 1); }, 51);
const roofT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#6e5a55'); for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { px(g, x + ((y / 8) % 2) * 4, y, 7, 7, ['#7a645e', '#64504b', '#735e58'][r() * 3 | 0]); px(g, x + ((y / 8) % 2) * 4, y + 6, 7, 1, '#4a3b37'); } }, 26);
const woodT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#a9764a'); for (let i = 0; i < 60; i++) px(g, r() * 64 | 0, r() * 64 | 0, 1, 6 + (r() * 22 | 0), ['#97663e', '#b9865a', '#8a5c38'][r() * 3 | 0]); px(g, 0, 0, 2, 64, '#6f4728'); px(g, 62, 0, 2, 64, '#6f4728'); }, 23);
const trimT = tex(16, 16, (g, r) => { px(g, 0, 0, 16, 16, '#efebe2'); grain(g, r, 16, 16, 12, ['#ddd8cc'], 1); }, 52);
const doorT = tex(32, 64, (g, r) => { px(g, 0, 0, 32, 64, '#2e8b7a'); grain(g, r, 32, 64, 60, ['#2a7d6e', '#349886'], 2); px(g, 4, 5, 24, 22, '#257264'); px(g, 4, 33, 24, 26, '#257264'); px(g, 5, 6, 22, 1, '#3aa892'); px(g, 5, 34, 22, 1, '#3aa892'); px(g, 25, 29, 3, 3, '#e8c34a'); }, 31);
const pathT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#a9a296'); for (let i = 0; i < 9; i++) { const x = r() * 28 | 0, y = r() * 28 | 0; px(g, x, y, 6 + (r() * 4 | 0), 5 + (r() * 3 | 0), ['#c9c2b4', '#bab3a5', '#d4cdbf'][r() * 3 | 0]); } }, 53);
const roomT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#d9c7a2'); for (let x = 0; x < 32; x += 8) px(g, x, 0, 3, 32, '#e6d6b4'); grain(g, r, 32, 32, 20, ['#c9b48f'], 1); }, 54);
const floorT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#8c6a4e'); for (let y = 0; y < 32; y += 6) px(g, 0, y, 32, 1, '#6f523c'); grain(g, r, 32, 32, 30, ['#9b7858', '#7d5e44'], 2); }, 55);
const sofaT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#8e6f86'); grain(g, r, 32, 32, 40, ['#7d5f75', '#9c7c94'], 2); px(g, 15, 0, 2, 32, '#6e5268'); }, 56);
const leafT = tex(64, 64, (g, r) => { px(g, 0, 0, 64, 64, '#3f7d4c'); grain(g, r, 64, 64, 420, ['#4c8f58', '#32683f', '#5fa566', '#2b5a38'], 3); }, 27);
const brassT = tex(16, 16, (g, r) => { px(g, 0, 0, 16, 16, '#d9a93b'); grain(g, r, 16, 16, 30, ['#f0c860', '#b8892a'], 1); px(g, 0, 2, 16, 1, '#f6dc8c'); }, 33);
const copperT = tex(16, 16, (g) => { for (let y = 0; y < 16; y++) px(g, 0, y, 16, 1, y % 2 ? '#a65a1c' : '#d9822b'); }, 34);
const batT = tex(32, 16, (g) => { px(g, 0, 0, 32, 16, '#f28c28'); px(g, 22, 0, 10, 16, '#1e1e22'); px(g, 6, 6, 5, 1, '#fff'); px(g, 8, 4, 1, 5, '#fff'); px(g, 0, 0, 32, 2, '#ffb35c'); }, 35);
const boxT = tex(32, 32, (g, r) => { px(g, 0, 0, 32, 32, '#e9e2d0'); grain(g, r, 32, 32, 40, ['#d8cfba', '#f4eedf'], 2); for (const [x, y] of [[3, 3], [27, 3], [3, 27], [27, 27]]) px(g, x, y, 2, 2, '#8a8270'); }, 32);
const skyT = tex(512, 480, (g, r) => {
  const S = [[0, '#3f6fd0'], [.20, '#5b8be0'], [.38, '#8fa6ea'], [.50, '#c9a3dc'], [.60, '#f3a6b4'], [.70, '#ffbf8f'], [.80, '#ffdf9a'], [.9, '#fff0c0']];
  const gr = g.createLinearGradient(0, 0, 0, 480); for (const [a, c] of S) gr.addColorStop(a, c); g.fillStyle = gr; g.fillRect(0, 0, 512, 480);
  const cloud = (x, y, n, s) => { for (let k = 0; k < n; k++) { const w = (18 + r() * 38) * s | 0, h = (4 + r() * 5) * s | 0, cx = x + (r() - .5) * 90 * s | 0, cy = y + (r() - .5) * 12 * s | 0; px(g, cx, cy, w, h, '#fff1ea'); px(g, cx + 2, cy, w - 4, 2, '#ffffff'); px(g, cx + 3, cy + h, w - 8, 2, '#e7b3cf'); } };
  cloud(70, 150, 8, 1.2); cloud(230, 110, 7, 1.1); cloud(400, 170, 8, 1.2); cloud(150, 235, 7, .9); cloud(300, 250, 7, .9); cloud(470, 90, 6, 1); cloud(30, 290, 6, .8);
}, 30);
skyT.wrapT = THREE.ClampToEdgeWrapping;
const skyM = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { map: { value: skyT }, uO: { value: new THREE.Vector2(.2, -.22) } }, vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = vec4(position.xy, 1., 1.); }', fragmentShader: 'uniform sampler2D map; uniform vec2 uO; varying vec2 u; void main(){ gl_FragColor = vec4(texture2D(map, vec2(u.x * .55 + uO.x, clamp(u.y + uO.y, 0., 1.))).rgb, 1.); }' });
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyM); sky.frustumCulled = false; sky.renderOrder = -10;

const CUTZ = 2.3; // the ground is cut here; the front block drops away during the cutaway
const ground = (x0, x1, z0, z1, n, k) => { const q = new Geo(); for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n, c = z0 + (z1 - z0) * j / k, d = z0 + (z1 - z0) * (j + 1) / k; q.quad([a, 0, d], [b, 0, d], [b, 0, c], [a, 0, c], [a / 2, -d / 2], [b / 2, -d / 2], [b / 2, -c / 2], [a / 2, -c / 2]); } return q; };
const interior = [];
const IM = (o) => { const m = mat(o); interior.push(m); return m; };
function makeHouse() {
  const g = new THREE.Group();
  const mG = mat({ map: grassT, color: 0x7db347 }), mS = mat({ map: strataT, color: 0x7a5436 }), mBr = mat({ map: brickT, color: 0xb0705c, affine: .5 }), mRoof = mat({ map: roofT, color: 0x6e5a55 }), mTrim = mat({ map: trimT, color: 0xefebe2 }), mPath = mat({ map: pathT, color: 0xa9a296 }), mWood = mat({ map: woodT, color: 0xa9764a, affine: .5 }), mL = mat({ map: leafT, color: 0x3f7d4c, affine: .5 }), mB = mat({ color: 0x6f4a30 });
  add(g, ground(-14, 14, -16, CUTZ, 14, 9), mG);
  const faceQ = new Geo(); for (let i = 0; i < 10; i++) { const a = -10 + i * 2, b = a + 2; faceQ.quad([a, -3.2, CUTZ], [b, -3.2, CUTZ], [b, 0, CUTZ], [a, 0, CUTZ], [a / 6.4, 0], [b / 6.4, 0], [b / 6.4, 1], [a / 6.4, 1]); }
  add(g, faceQ, mS);
  const front = grp(g); add(front, ground(-14, 14, CUTZ, 12, 14, 5), mG); add(front, new Geo().box(1.3, .03, 9.7, 0, .02, CUTZ + 4.85, { all: [0, 0, 1, 6] }), mPath);
  add(g, new Geo().box(1.3, .03, CUTZ, 0, .02, CUTZ / 2, { all: [0, 0, 1, 2] }), mPath);
  // front wall with a door hole (x -.5..5, y 0..2.1) and a window hole (x 1.4..2.6, y 1..2.1)
  const Wd = 7, Ht = 3.2, wallG = new Geo();
  for (const [x0, x1, y0, y1] of [[-3.5, -.5, 0, Ht], [-.5, .5, 2.1, Ht], [.5, 1.4, 0, Ht], [1.4, 2.6, 0, 1.0], [1.4, 2.6, 2.1, Ht], [2.6, 3.5, 0, Ht]])
    wallG.box(x1 - x0, y1 - y0, .2, (x0 + x1) / 2, (y0 + y1) / 2, -.1, { all: [x0 / 2, y0 / 2, x1 / 2, y1 / 2] });
  add(g, wallG, mBr);
  add(g, new Geo().box(.2, Ht, 5, -3.4, Ht / 2, -2.5, { all: [0, 0, 2.5, 1.6] }).box(.2, Ht, 5, 3.4, Ht / 2, -2.5, { all: [0, 0, 2.5, 1.6] }), mBr);
  add(g, new Geo().quad([-3.8, Ht - .1, .5], [3.8, Ht - .1, .5], [3.8, Ht + 1.9, -2.5], [-3.8, Ht + 1.9, -2.5], [0, 0], [3, 0], [3, 1.6], [0, 1.6]).quad([3.8, Ht - .1, -5.5], [-3.8, Ht - .1, -5.5], [-3.8, Ht + 1.9, -2.5], [3.8, Ht + 1.9, -2.5], [0, 0], [3, 0], [3, 1.6], [0, 1.6]), mRoof);
  add(g, new Geo().tri([-3.5, Ht, 0], [-3.5, Ht, -5], [-3.5, Ht + 1.8, -2.5]).tri([3.5, Ht, -5], [3.5, Ht, 0], [3.5, Ht + 1.8, -2.5]), mBr);
  add(g, new Geo().box(.5, 1.2, .5, 2.2, Ht + 1.6, -3.4), mBr);
  // trim: door frame, window frame and sill
  add(g, new Geo().box(.12, 2.2, .26, -.56, 1.1, -.05).box(.12, 2.2, .26, .56, 1.1, -.05).box(1.24, .14, .26, 0, 2.17, -.05).box(1.36, .1, .26, 2, 2.12, -.05).box(1.5, .1, .36, 2, .97, 0).box(.08, 1.15, .26, 1.36, 1.55, -.05).box(.08, 1.15, .26, 2.64, 1.55, -.05), mTrim);
  // the room inside (dims when the lights go off)
  const mRoom = IM({ map: roomT, color: 0xd9c7a2, em: .35 }), mFloor = IM({ map: floorT, color: 0x8c6a4e, em: .25 }), mSofa = IM({ map: sofaT, color: 0x8e6f86, em: .2 }), mLamp = IM({ color: 0xfff2c4, em: 1 }), mTv = IM({ color: 0x7fd4ff, em: 1 });
  add(g, new Geo().box(6.6, .05, 4.8, 0, .02, -2.5), mFloor); add(g, new Geo().box(6.6, Ht, .1, 0, Ht / 2, -4.9, { all: [0, 0, 4, 2] }).box(6.6, .1, 4.8, 0, Ht, -2.5), mRoom);
  add(g, new Geo().box(1.9, .45, .8, 2, .3, -2.7).box(1.9, .7, .25, 2, .75, -3.0).box(.22, .6, .8, 2.95, .45, -2.7).box(.22, .6, .8, 1.05, .45, -2.7), mSofa);
  add(g, new Geo().box(.24, .24, .24, 1.3, 2.9, -2.2), mLamp); add(g, new Geo().box(.06, .6, 1, -3.25, 1.4, -2.4), mTv);
  // yard: fence, cone trees, trash cans
  const mC = mat({ color: 0x9aa4b4 }), mD = mat({ color: 0x8e98a8 });
  for (let i = -13; i <= 13; i++) { if (Math.abs(i * .62) < 1) continue; add(g, new Geo().hexa((a, b, c) => [a * .26, b > 0 ? 1.0 : 0, c * .05]).tri([-.26, 1.0, 0], [.26, 1.0, 0], [0, 1.25, 0], [0, 0], [1, 0], [.5, .2]), mWood, i * .62, 0, 6.2); }
  const tree = (x, z, s) => { const t = grp(g, x, 0, z); t.scale.setScalar(s); add(t, new Geo().loft([{ y: 0, rx: .22, rz: .22 }, { y: 1.1, rx: .16, rz: .16 }], 5), mB); for (const [y, a, h] of [[.8, 1.5, 1.7], [1.9, 1.15, 1.5], [2.9, .8, 1.5]]) add(t, new Geo().loft([{ y, rx: a, rz: a }, { y: y + h, rx: .02, rz: .02 }], 6, { cap1: false }), mL); };
  tree(-5.2, -1, 1.3); tree(5.6, -.5, 1.1); tree(-7.5, -4, 1.6); tree(8, -5, 1.5);
  const can = (x, z) => { const t = grp(g, x, 0, z); add(t, new Geo().loft([{ y: 0, rx: .34, rz: .34 }, { y: .86, rx: .40, rz: .40 }], 8, { cap1: false }), mC); add(t, new Geo().loft([{ y: .85, rx: .45, rz: .45 }, { y: .93, rx: .42, rz: .42 }, { y: 1.0, rx: .12, rz: .12 }], 8), mD); };
  can(3.9, .6); can(4.7, .9);
  return { g, front };
}

// ---------- props ----------
const mDoor = mat({ map: doorT, color: 0x2e8b7a, affine: .5 }), mPlank = mat({ map: woodT, color: 0xc9a46e }), mBrass = mat({ map: brassT, color: 0xd9a93b }), mRope = mat({ color: 0xc9a46e }), mDark = mat({ color: 0x3e4350 }), mGrey = mat({ color: 0x9aa0ab }), mCop = mat({ map: copperT, color: 0xd9822b }), mBat = mat({ map: batT, color: 0xf28c28, affine: .5 }), mBtn = mat({ color: 0xff3b30, em: .3 }), mGlow = mat({ color: 0xffffff, em: 1 }), mBolt = mat({ color: 0xffe74a, em: 1 }), mBoxW = mat({ map: boxT, color: 0xe9e2d0 });
const door = new THREE.Group(); door.position.set(-.46, 0, -.06); add(door, new Geo().box(.92, 2.06, .07, .46, 1.03, 0), mDoor);
const planks = grp(door); add(planks, new Geo().box(1.1, .14, .04, .46, 1.3, .06), mPlank).rotation.z = .55; add(planks, new Geo().box(1.1, .14, .04, .46, 1.3, .07), mPlank).rotation.z = -.55;
const dome = (r, h, seg = 8) => new Geo().loft([{ y: 0, rx: r, rz: r }, { y: h * .55, rx: r * .78, rz: r * .78 }, { y: h, rx: r * .3, rz: r * .3 }], seg, { cap0: false });
const BELLX = -1.05;
const bracket = new THREE.Group(); bracket.position.set(BELLX, 2.78, 0); add(bracket, new Geo().box(.1, .1, .56, 0, 0, .28).box(.14, .3, .04, 0, -.05, .02), mDark);
const bell = new THREE.Group(); add(bell, dome(.22, .28), mBrass, 0, -.28, 0); add(bell, new Geo().box(.06, .08, .06, 0, -.02, 0), mDark); add(bell, new Geo().box(.07, .07, .07, 0, -.32, 0), mDark);
const rope = add(bell, new Geo().box(.04, 1.0, .04, 0, -.82, 0).box(.08, .1, .08, 0, -1.34, 0), mRope), ropeStub = add(bell, new Geo().box(.04, .3, .04, 0, -.48, 0), mRope);
const ropeFall = add(new THREE.Group(), new Geo().box(.04, .7, .04), mRope);
// the electric bell box on the wall: housing gets sliced, the mechanism inside stays whole
const BOXY = 2.0, BOXZ = .34;
const boxRoot = new THREE.Group(); boxRoot.position.set(BELLX, BOXY, BOXZ);
const housing = [-1, 1].map((side) => { const m = mat({ map: boxT, color: 0xe9e2d0 }); m.uniforms.uSide.value = side; m.uniforms.uInC.value.set(.26, .2, .3); return { o: add(boxRoot, new Geo().box(.86, 1.0, .68, 0, 0, 0, { all: [0, 0, 1, 1] }), m), m }; });
const housingWhole = add(boxRoot, new Geo().box(.86, 1.0, .68, 0, 0, 0, { all: [0, 0, 1, 1] }), mBoxW);
const frontBell = add(boxRoot, dome(.14, .12), mBrass, -.05, .3, .34); frontBell.rotation.x = Math.PI / 2;
const mech = grp(boxRoot);
add(mech, dome(.16, .14), mBrass, -.06, .27, -.24).rotation.x = Math.PI / 2;
const coil = grp(mech, -.06, -.02, -.05); add(coil, new Geo().loft([{ y: -.13, rx: .075, rz: .075 }, { y: .13, rx: .075, rz: .075 }], 8), mCop).rotation.z = Math.PI / 2;
const nail = grp(coil); add(nail, new Geo().box(.36, .028, .028, .02, 0, 0).box(.02, .08, .08, -.16, 0, 0), mGrey);
const hammer = grp(mech, .2, -.26, -.05); add(hammer, new Geo().box(.03, .5, .03, 0, .25, 0).box(.05, .09, .05, -.01, .24, 0).box(.08, .08, .08, 0, .5, 0), mDark);
const spring = grp(mech, .33, -.06, -.05); add(spring, new Geo().box(.06, .09, .06), mGrey); for (let i = 0; i < 4; i++) add(spring, new Geo().box(.03, .008, .03, -.05 - i * .018, i % 2 ? .012 : -.012, 0), mGrey);
const battery = grp(mech, -.02, -.37, -.05); add(battery, new Geo().loft([{ y: -.16, rx: .07, rz: .07 }, { y: .16, rx: .07, rz: .07 }], 8), mBat).rotation.z = Math.PI / 2;
const wires = grp(mech); for (const [x0, y0, x1, y1] of [[.16, -.37, .38, -.37], [.38, -.37, .38, -.5], [-.18, -.37, -.3, -.37], [-.3, -.37, -.3, -.02], [-.3, -.02, -.2, -.02], [.08, -.08, .2, -.26]]) { const L = Math.hypot(x1 - x0, y1 - y0); add(wires, new Geo().box(L, .018, .018), mCop, (x0 + x1) / 2, (y0 + y1) / 2, -.05).rotation.z = Math.atan2(y1 - y0, x1 - x0); }
const spark = add(mech, new Geo().box(.05, .05, .05), mGlow, .27, -.06, 0);
const btn = new THREE.Group(); btn.position.set(-.73, 1.25, .04); add(btn, new Geo().box(.16, .22, .05), mBoxW); add(btn, new Geo().box(.08, .08, .06, 0, 0, .04), mBtn);
const ringG = (() => { const q = new Geo(); for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2, b = (j + 1) / 10 * Math.PI * 2; q.quad([Math.cos(a), Math.sin(a), 0], [Math.cos(b), Math.sin(b), 0], [Math.cos(b) * .85, Math.sin(b) * .85, 0], [Math.cos(a) * .85, Math.sin(a) * .85, 0]); } return q; })();
const rings = [0, 1, 2].map(() => { const m = mat({ color: 0xffffff, em: 1, transparent: true, depthWrite: false }); return add(new THREE.Group(), ringG, m); });
const streaks = Array.from({ length: 8 }, () => add(new THREE.Group(), new Geo().box(.04, .04, .36), mGlow));
const bolts = Array.from({ length: 6 }, () => add(new THREE.Group(), new Geo().box(.04, 1, .04), mBolt));

// ---------- scene ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, W / H, .05, 80);
scene.add(sky); const house = makeHouse(); scene.add(house.g);
const wolf = makeWolf(); scene.add(wolf.root);
const pig = makePig(), cop = makePig({ cop: true }); scene.add(pig.root, cop.root);
for (const o of [door, bracket, bell, ropeFall.parent, boxRoot, btn, ...rings.map((r) => r.parent), ...streaks.map((s) => s.parent), ...bolts.map((b) => b.parent)]) scene.add(o);
console.log('wolf triangles', wolf.tris);

// ---------- timing (from the real voice) ----------
const WORDS = window.WORDS, ENV = window.ENV, END = 41.2;
const at = (w, n = 1) => { let k = 0; for (const x of WORDS) if (x[2].replace(/[^a-z']/gi, '').toLowerCase() === w && ++k === n) return x[0]; throw new Error('no word ' + w); };
const T = { selling: at('selling'), hears: at('hears'), knock: at('knock'), so1: at('so'), huff: at('huff'), puff: at('puff'), blow: at('blow'), down: at('down'), genius1: at('genius'), except1: at('except'), felony: at('felony'), tased: at('tased'),
  so2: at('so', 2), bell: at('bell'), rope: at('rope'), pull: at('pull'), clever: at('clever'), but2: at('but', 2), snaps: at('snaps'), lands: at('lands'), skull: at('skull'),
  so3: at('so', 3), wire: at('wire'), button: at('button'), battery: at('battery'), wrap: at('wrap'), nail: at('nail'), that: at('that'), magnet: at('electromagnet'), which: at('which'), hammer: at('hammer'), intoBell: at('bell', 3),
  genius2: at('genius', 2), except2: at('except', 2), dings: at('dings'), once: at('once'), so4: at('so', 4), spring: at('spring'), breaks: at('breaks'), buzzes: at('buzzes'), now: at('now'), hear: at('hear'), ring: at('ring'), and9: at('they'), pretend: at('pretend'), not: at('not'), home: at('home') };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); }, overshoot = (x) => { x = clamp(x) - 1; return 1 + x * x * (2.7 * x + 1.7); };
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (a, b, k) => { const o = { ...a }; for (const q in b) o[q] = typeof b[q] === 'number' ? (a[q] ?? 0) + (b[q] - (a[q] ?? 0)) * k : (k > .5 ? b[q] : a[q]); return o; };
const popS = (t, t0) => t < t0 ? 0.0001 : overshoot((t - t0) / .18);
const SLICE0 = T.wire, SLICE1 = T.now, DROP0 = T.that, DROP1 = T.now;

// ---------- shots: hard cuts on new beats, a short ease-out push inside a shot ----------
// [start, pos, look, fov, (optional) [moveStart, pos2, look2, len]]
const SHOTS = [
  [0, [2.1, 1.6, 5.7], [-.8, 1.15, 1.4], 40, [1.5, [1.5, 1.55, 4.7], [-.35, 1.2, 1.0], .4]],
  [T.hears - .05, [2.05, 1.6, 2.9], [2.0, 1.15, -2.6], 30, [T.hears, [2.0, 1.55, 2.3], [2.0, 1.12, -2.6], .25]],
  [T.so1, [.45, 1.75, .25], [0, 1.55, 1.75], 44, [T.puff, [.35, 1.72, .4], [0, 1.6, 1.75], .25]],
  [T.blow, [-3.7, 1.45, 3.9], [.1, 1.25, .6], 38, [T.genius1, [-2.7, 1.6, 3.6], [-.1, 1.45, 1.3], .25]],
  [T.except1, [-4.4, 1.35, 3.7], [.05, 1.0, 1.0], 38],
  [T.tased + .3, [-3.0, 1.1, 4.0], [-.1, .6, 1.6], 40],
  [T.so2, [1.0, 1.85, 4.4], [-.85, 1.75, .6], 36, [T.bell, [.6, 2.0, 3.6], [-.95, 2.1, .5], .25]],
  [T.clever, [-.15, 1.6, 3.9], [-.75, 1.45, .85], 34],
  [T.but2, [1.7, 1.0, 4.6], [-.85, 1.6, .8], 38, [T.lands, [.8, 1.35, 4.0], [-.8, 1.5, .85], .2]],
  [T.so3, [-.55, 1.7, 2.9], [-.9, 1.62, 0], 34],
  [T.that, [.2, 1.5, 7.0], [-.55, 1.0, .5], 36],
  [T.which, [-.72, 2.06, 2.1], [-1.05, 1.98, 0], 34],
  [T.genius2, [.75, 1.45, 4.7], [.25, 1.25, 1.1], 36],
  [T.except2, [.9, 1.55, 6.6], [-.15, 1.3, .4], 38],
  [T.so4, [-.72, 2.06, 2.1], [-1.05, 1.98, 0], 34, [T.buzzes, [-.5, 1.9, 3.2], [-.9, 1.8, 0], .25]],
  [T.now, [1.3, 1.6, 7.0], [.8, 1.4, 0], 38],
  [T.and9, [2.45, 1.6, 2.7], [2.0, 1.2, -2.4], 32, [T.home + .25, [1.5, 1.95, 7.4], [.4, 1.35, 0], .9]],
];
const camAt = (t) => {
  let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x;
  let p = s[1], l = s[2];
  if (s[4]) { const [m0, p2, l2, len] = s[4]; const k = len > .5 ? smooth((t - m0) / len) : 1 - (1 - clamp((t - m0) / len)) ** 3; p = p.map((v, i) => lerp(v, p2[i], k)); l = l.map((v, i) => lerp(v, l2[i], k)); }
  return { p, l, fov: s[3] };
};

// ---------- wolf staging: a new pose on every sentence, landing on its stressed word ----------
const ZERO = { ry: 0, lean: 0, side: 0, hip: 0, ll: 0, rl: 0, hx: 0, hy: 0, hz: 0, lx: 0, rx_: 0, lz: .3, rz_: .3, le: -.4, re: -.4, lh: 0, rh: 0, ear: 0, sq: 1, face: 'open', puff: 0 };
const BACK = Math.PI; // facing the door
const CUES = [
  [0, { face: 'happy', case: 1 }],
  [T.hears, { face: 'half', case: 1, rx_: -1.8, rz_: .25, re: -1.5, hy: .2 }],
  [T.huff, { face: 'wide', puff: .6, lean: -.12, lz: .65, rz_: .65, le: -1.5, re: -1.5, hx: -.12, sq: 1.05 }],
  [T.puff, { face: 'wide', puff: 1, lean: -.18, lz: .7, rz_: .7, le: -1.6, re: -1.6, hx: -.18, sq: 1.08 }],
  [T.blow, { face: 'closed', puff: 0, lean: .3, lz: 1.1, rz_: 1.1, le: -.2, re: -.2, lx: .5, rx_: .5, hx: .12, sq: .96, ear: .5 }],
  [T.genius1, { face: 'smug', lx: -2.5, le: -1.5, lz: .35, side: -.08, hz: -.1 }],
  [T.felony, { face: 'wide', lz: 1.0, rz_: 1.0, le: -.35, re: -.35, lx: -.2, rx_: -.2, lean: -.08, ear: .4 }],
  [T.so2, { face: 'half', brace: 1, hy: .4, hx: -.1 }],
  [T.bell, { face: 'open', brace: 1, lx: -2.5, lz: .1, le: -.3, hx: -.25, hy: .25 }],
  [T.pull, { face: 'happy', brace: 1, lx: -2.1, lz: .1, le: -.5, hx: -.2 }],
  [T.clever, { face: 'happy', brace: 1, rx_: -2.3, re: -1.5, rz_: .3, hz: .1, side: .05 }],
  [T.snaps, { face: 'wide', brace: 1, hx: -.35, lz: .6, rz_: .6, le: -.7, re: -.7, ear: .3 }],
  [T.lands, { face: 'dizzy', brace: 1, sq: .88, hip: -.05, lz: .15, rz_: .15, le: -.1, re: -.1, hz: .14, side: .1, ear: .6 }],
  [T.button, { face: 'open', brace: 1, bandage: 1, lx: -1.4, lz: .5, le: -.25, hy: -.4 }],
  [T.wrap, { face: 'half', brace: 1, bandage: 1, lx: -1.0, le: -1.8, rx_: -1.0, re: -1.8, lz: .15, rz_: .15, hy: -.3 }],
  [T.magnet, { face: 'wide', brace: 1, bandage: 1, lx: -1.7, lz: .9, le: -.1, hy: -.35, lean: .05 }],
  [T.genius2, { face: 'smug', brace: 1, bandage: 1, rx_: -2.5, re: -1.5, rz_: .3, hz: -.1, side: -.06 }],
  [T.except2, { face: 'open', brace: 1, bandage: 1, lx: -1.25, le: -.2, lz: .2 }],
  [T.once, { face: 'half', brace: 1, bandage: 1, lx: -1.25, le: -.2, lz: .2, hy: -1.2, hx: .1 }],
  [T.spring, { face: 'open', brace: 1, bandage: 1, lx: -1.25, le: -.2, lz: .2 }],
  [T.ring, { face: 'happy', brace: 1, bandage: 1, lx: -1.25, le: -.2, lz: .2, rz_: .6, hz: .08 }],
  [T.not, { face: 'half', brace: 1, bandage: 1, lx: -1.25, le: -.2, lz: .2, hy: -1.25, hx: .12, ear: .45 }],
];
const STRESS = CUES.slice(1).map((c) => c[0]).concat(WORDS.filter((w) => w[2].replace(/[^a-z]/gi, '').length >= 7).map((w) => w[0]));
function wolfPlace(t) {
  // where he stands and which way he faces, per beat
  if (t < T.selling + 1.9) { const k = clamp(t / 2.1), walk = Math.sin(t * 9); return { x: lerp(-2.7, -.05, k), z: lerp(3.3, 1.05, k), ry: Math.atan2(2.65, -2.25) * (1 - smooth((t - 1.6) / .5)) + BACK * smooth((t - 1.6) / .5), ll: walk * .5 * (1 - k * k), rl: -walk * .5 * (1 - k * k), lx: -walk * .35 * (1 - k * k), hip: Math.abs(walk) * .02 }; }
  if (t < T.so1) return { x: -.05, z: 1.05, ry: BACK };
  if (t < T.genius1) return { x: 0, z: 1.75, ry: BACK };
  if (t < T.except1) return { x: 0, z: 1.75, ry: lerp(BACK, Math.PI * 2 - 1.0, overshoot((t - T.genius1) / .22)) };
  if (t < T.so2) { const fall = smooth((t - (T.tased + .5)) / .3); return { x: 0, z: 1.75, ry: BACK, rx: fall * 1.5 }; }
  if (t < T.clever) return { x: BELLX + .3, z: .85, ry: 0 };
  if (t < T.but2) return { x: BELLX + .3, z: .85, ry: lerp(0, -.25, overshoot((t - T.clever) / .22)) };
  if (t < T.so3) return { x: BELLX + .3, z: .85, ry: 0 };
  if (t < T.genius2) return { x: .1, z: 1.15, ry: -.6 };
  if (t < T.except2) return { x: .25, z: 1.1, ry: 0 };
  return { x: -.12, z: .5, ry: -Math.PI / 2 };
}

// ---------- 2D overlay at 270x480: captions and the one label ----------
const ov = document.createElement('canvas'); ov.width = LW; ov.height = LH; const og = ov.getContext('2d', { willReadFrequently: true });
function chunkyText(text, x, y, size, fill, outline) {
  og.font = `900 ${size}px "Archivo Black", "Arial Black", Impact, sans-serif`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.lineWidth = Math.max(3, size * .26); og.strokeStyle = outline; og.strokeText(text, x, y); og.fillStyle = fill; og.fillText(text, x, y);
}
function hardOverlay() { const d = og.getImageData(0, 0, LW, LH); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; og.putImageData(d, 0, 0); }
const v3 = new THREE.Vector3();
const toScreen = (obj, off = [0, 0, 0]) => { v3.set(...off); obj.localToWorld(v3); v3.project(cam); return [(v3.x * .5 + .5) * LW, (-v3.y * .5 + .5) * LH, v3.z]; };
const placeRing = (k, pos, d, life = .5) => { const g = rings[k].parent; g.visible = d >= 0 && d < life; if (!g.visible) return; g.position.set(...pos); g.scale.setScalar(.12 + d * 1.1); g.lookAt(cam.position); rings[k].material.uniforms.uAlpha.value = 1 - d / life; };

function drawFrame(t) {
  t = clamp(t, 0, END);
  const amp = ENV[Math.min(ENV.length - 1, Math.round(t * 30))] || 0;
  // wolf
  const i = CUES.filter((c) => t >= c[0]).length - 1;
  let q = mix({ ...ZERO, ...CUES[Math.max(0, i - 1)][1] }, { ...ZERO, ...CUES[i][1] }, i ? overshoot((t - CUES[i][0]) / .22) : 1);
  q.brace = CUES[i][1].brace; q.bandage = CUES[i][1].bandage; q.case = t < T.tased;
  let nod = 0; for (const s of STRESS) { const d = t - s; if (d > 0 && d < .36) nod += .12 * Math.sin(d / .36 * Math.PI); }
  const pl = wolfPlace(t);
  q = { ...q, ...pl, lx: (q.lx || 0) + (pl.lx || 0), jaw: t > T.blow && t < T.down + .4 ? .95 : q.face === 'dizzy' ? .4 : Math.min(1, amp * 1.1),
    hx: (q.hx || 0) + nod, hz: (q.hz || 0) + Math.sin(t * Math.PI / 2) * .04, tail: Math.sin(t * Math.PI * 1.1) * .8, tl: .45, sq: (q.sq || 1) * (1 + .014 * Math.sin(t * Math.PI * 1.6)),
    earT: .08 * Math.max(0, Math.sin(t * 2.3)) ** 8, earT2: .08 * Math.max(0, Math.sin(t * 1.9 + 2)) ** 8 };
  if ([1.9, 9.0, 13.2, 21.0, 26.0, 33.0, 37.3].some((b) => t >= b && t < b + .1) && ['open', 'half', 'smug'].includes(q.face)) q.face = 'closed';
  if (t >= T.knock - .3 && t < T.knock + .5) q.re = -1.5 + .45 * Math.abs(Math.sin((t - T.knock + .3) * 20));
  if (t >= T.pull && t < T.clever) { q.le = -.5 - .6 * Math.abs(Math.sin((t - T.pull) * 9)); }
  if (t >= T.snaps && t < T.lands) q.lx = -2.6;
  if (t >= T.lands) { if (t < T.so3) { q.side += Math.sin((t - T.lands) * 7) * .1; q.hz += Math.sin((t - T.lands) * 7) * .1; } }
  if (t >= T.wrap && t < T.nail) { q.lh = Math.sin(t * 12) * .6; q.rh = -Math.sin(t * 12) * .6; }
  const presses = [T.except2 + .3, T.dings - .05, T.once + .2, T.spring - .3, T.breaks - .2];
  const pressing = presses.some((p) => t >= p - .08 && t < p + .14) || t >= T.buzzes - .1;
  if (t >= T.except2 && pressing) { q.lx -= .22; q.le += .2; }
  if (t >= T.genius2 - .05 && t < T.except2) q.case = false;
  wolf.pose(q);
  const zap = t >= T.tased && t < T.tased + .55 ? Math.sin((t - T.tased) / .55 * Math.PI) : 0;
  wolf.set('uExp', zap * .5); wolf.set('uFlash', zap > 0 ? (Math.floor(t * 30) % 2 ? .6 : .1) : 0);
  wolf.set('uRed', t >= T.lands && t < T.lands + .35 ? .7 * (1 - (t - T.lands) / .35) : t >= T.skull && t < T.skull + .3 ? .5 * (1 - (t - T.skull) / .3) : 0);
  // homeowner pig on the sofa: zoned out -> hears -> ducks
  const ducked = smooth((t - (T.pretend - .1)) / .25);
  pig.pose({ x: 2.0, y: -.05 - ducked * 1.25, z: -2.55, ry: t >= T.hear ? .15 : -.55, sit: 1, phones: t < T.hear + .15, bob: t < T.hear ? Math.abs(Math.sin(t * 5)) * .04 : 0, hx: t < T.hear ? Math.sin(t * 5) * .12 : 0,
    face: t >= T.hear ? 'wide' : 'closed', mouth: t >= T.hear && t < T.pretend ? .8 : 0, la: t >= T.hear && t < T.hear + .35 ? 2.6 : .5, ra: .5 });
  // cop pig steps into the doorway
  cop.root.visible = t >= T.except1 && t < T.so2;
  cop.pose({ x: .12, z: lerp(-.6, .2, smooth((t - T.except1) / .4)), ry: 0, ra: t >= T.tased - .5 ? 1.5 : .3, la: .2, mouth: t >= T.felony && t < T.tased ? .5 : 0, face: 'open' });
  // the door: knocked, blown in, back on its hinges with planks
  const fly = t >= T.blow + .15 && t < T.so2 ? smooth((t - T.blow - .15) / .3) : 0;
  door.position.set(-.46 + fly * .5, fly * .2, -.06 - fly * 2.6); door.rotation.set(-fly * 1.5, fly * .5, 0);
  door.visible = !(t >= T.except1 && t < T.so2); planks.visible = t >= T.so2;
  // brass bell: on the bracket, rope, snaps, lands on your skull
  bracket.visible = t >= T.so2 && t < T.so3; bracket.scale.setScalar(popS(t, T.bell));
  const bellOn = t >= T.so2 && t < T.so3 + .2; bell.visible = bellOn;
  if (bellOn) {
    const head = new THREE.Vector3(0, .66, .02); wolf.head.localToWorld(head);
    const p0 = new THREE.Vector3(BELLX, 2.76, .5), p1 = head.clone().add(new THREE.Vector3(0, .26, 0)), d = smooth((t - (T.lands - .28)) / .3);
    bell.position.lerpVectors(p0, p1, d); bell.position.y += Math.sin(d * Math.PI) * .25;
    bell.rotation.set(t >= T.pull && t < T.snaps ? Math.sin((t - T.pull) * 7) * .3 * Math.exp(-(t - T.pull) * 1.5) : 0, 0, Math.sin(d * Math.PI) * 1.0 + (t > T.lands ? Math.sin((t - T.lands) * 9) * .12 * Math.exp(-(t - T.lands) * 2) : 0));
    bell.scale.setScalar(popS(t, T.bell) * (t > T.so3 ? 1 - smooth((t - T.so3) / .2) + .0001 : 1));
    rope.visible = t >= T.rope && t < T.snaps; rope.scale.setScalar(popS(t, T.rope)); ropeStub.visible = t >= T.snaps;
  }
  ropeFall.parent.visible = t >= T.snaps && t < T.snaps + .7;
  if (ropeFall.parent.visible) { const k = t - T.snaps; ropeFall.parent.position.set(BELLX + k * .3, 1.85 - 4.9 * k * k, .5); ropeFall.parent.rotation.z = k * 3; }
  // bell box + slice
  const boxOn = t >= T.so3 - .05; boxRoot.visible = boxOn; boxRoot.scale.setScalar(popS(t, T.so3 - .05)); btn.visible = t >= T.button; btn.scale.setScalar(popS(t, T.button));
  const open = smooth((t - SLICE0 - .12) / .3) * (1 - smooth((t - SLICE1) / .3)), cut = open > .01;
  housingWhole.visible = !cut; frontBell.visible = !cut; mech.visible = cut;
  boxRoot.updateMatrixWorld(true); const inv = boxRoot.matrixWorld.clone().invert();
  for (const h of housing) { h.o.visible = cut; h.m.uniforms.uOpen.value = .5 * open; h.m.uniforms.uShift.value = .34 * open; h.m.uniforms.uRoot.value.copy(boxRoot.matrixWorld); h.m.uniforms.uRootI.value.copy(inv); }
  battery.scale.setScalar(popS(t, T.battery)); wires.visible = t >= T.battery;
  coil.scale.set(Math.max(.0001, smooth((t - T.wrap) / (T.nail - T.wrap))), 1, 1);
  nail.visible = t >= T.nail; nail.position.x = -.5 * (1 - smooth((t - T.nail) / .25));
  hammer.scale.setScalar(popS(t, T.hammer)); spring.scale.setScalar(popS(t, T.spring));
  let th = -.08;
  if (t >= T.intoBell - .25 && t < T.spring) th = .1 * smooth((t - (T.intoBell - .25)) / .2);
  if (t >= T.except2 && t < T.dings - .05) th = -.08;
  if (t >= T.spring) th = -.08;
  if (t >= T.breaks && t < T.buzzes) th = (t - T.breaks) % .5 < .15 ? .1 : -.08;
  if (t >= T.buzzes) th = Math.floor(t * 30) % 2 ? .1 : -.08;
  hammer.rotation.z = th; spark.visible = t >= T.breaks && th > 0 && t < SLICE1;
  mCop.uniforms.uEm.value = t >= T.magnet && t < SLICE1 ? .35 + .25 * Math.sin(t * 9) : 0; mCop.uniforms.uFlash.value = t >= T.magnet && t < T.magnet + .25 ? .5 : 0;
  // ground drops away for the cutaway
  const drop = smooth((t - DROP0) / .35) * (1 - smooth((t - DROP1) / .35));
  house.front.position.y = -5 * drop * drop; house.front.visible = drop < .98;
  // lights off on "not home"
  const dim = t >= T.home ? .3 : 1; for (const m of interior) { m.uniforms.uDim.value = dim; }
  // camera
  const c = camAt(t);
  cam.fov = c.fov; cam.updateProjectionMatrix();
  cam.position.set(c.p[0] + Math.sin(t * Math.PI / 4) * .04, c.p[1], c.p[2]); cam.lookAt(...c.l);
  if (t >= T.lands && t < T.lands + .2) cam.position.y += Math.sin(t * 90) * .03;
  if (t >= T.blow + .15 && t < T.blow + .4) cam.position.x += Math.sin(t * 80) * .03;
  cam.updateMatrixWorld();
  // rings (knocks, dings), wind, taser bolts
  const B = boxRoot.position, bellBox = [BELLX - .06, BOXY + .27, BOXZ + .2];
  const hp = new THREE.Vector3(0, .9, .1); wolf.head.localToWorld(hp);
  placeRing(0, [-.05, 1.45, .1], [T.knock - .25, T.knock, T.knock + .25].map((k) => t - k).filter((d) => d >= 0).pop() ?? -1, .25);
  placeRing(1, t < T.so3 ? [BELLX, 2.4, .55] : bellBox, t < T.lands ? t - (T.pull + .15) : t < T.so3 ? -1 : t < T.except2 ? t - T.intoBell : t < T.so4 ? t - T.dings : -1);
  placeRing(2, t < T.so3 ? [hp.x, hp.y, hp.z] : bellBox, t < T.so3 ? t - T.lands : t >= T.buzzes && t < T.home ? (t * 2) % .5 : -1);
  if (t >= T.buzzes && t < T.home && !cut) rings[2].parent.position.set(BELLX - .05, BOXY + .3, BOXZ + .45);
  streaks.forEach((s, k) => { const d = t - T.blow - k * .04; const on = d > 0 && d < .5; s.parent.visible = on; if (on) s.parent.position.set((k % 4 - 1.5) * .12, 1.55 + (k % 3 - 1) * .12 + Math.sin(d * 14 + k) * .03, 1.2 - d * 2.6); });
  const zapOn = t >= T.tased - .05 && t < T.tased + .45;
  bolts.forEach((b, k) => { b.parent.visible = zapOn; if (!zapOn) return; const r = rnd(Math.floor(t * 15) * 7 + k), a = [.25, 1.05, .55], z = [0, 1.25, 1.65], u = k / 6, v = (k + 1) / 6;
    const pa = a.map((x, j) => lerp(x, z[j], u) + (k ? (r() - .5) * .25 : 0)), pb = a.map((x, j) => lerp(x, z[j], v) + (k < 5 ? (r() - .5) * .25 : 0));
    const dir = new THREE.Vector3(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]); b.parent.position.set((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2); b.scale.set(1, dir.length(), 1); b.parent.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); });
  // render the low-res frame, scanlines, overlay
  shoot(ctx, scene, cam, {});
  ctx.fillStyle = 'rgba(10,4,24,.07)'; for (let y = 4; y < H; y += 8) ctx.fillRect(0, y, W, 4);
  og.clearRect(0, 0, LW, LH);
  if (open > .9 && t >= T.magnet) {
    const [x, y, z] = toScreen(coil, [-.08, .06, .08]);
    if (z < 1 && x > 0 && x < LW && y > 0 && y < LH) {
      const lx = Math.min(LW - 72, Math.max(72, x + 16)), ly = Math.max(30, y - 64);
      og.strokeStyle = '#1a1320'; og.lineWidth = 4; og.beginPath(); og.moveTo(x, y); og.lineTo(lx, ly + 10); og.stroke();
      og.strokeStyle = '#ffd23f'; og.lineWidth = 2; og.beginPath(); og.moveTo(x, y); og.lineTo(lx, ly + 10); og.stroke();
      og.fillStyle = '#ffd23f'; og.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
      chunkyText('ELECTROMAGNET', lx, ly, 17, '#ffd23f', '#1a1320');
    }
  }
  const w = WORDS.filter((x) => t >= x[0]).pop();
  if (w && t < w[1] + .25) { const k = smooth((t - w[0]) / .08); chunkyText(w[2].replace(/[.,!?]/g, ''), LW / 2, 352 - 3 * (1 - k), 36, '#ffffff', '#1a1320'); }
  hardOverlay();
  ctx.imageSmoothingEnabled = false; ctx.drawImage(ov, 0, 0, W, H);
}
window.drawFrame = drawFrame; window.END = END;
window.ready = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { drawFrame(1.2); });
