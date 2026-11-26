// ---------- engine (from the low-poly-explainer kit) ----------
const { W, H, LW, LH, rnd, hex, tex, px, grain, Geo, look, mat, gl, shoot } = (() => {
const W = 1080, H = 1920, LW = 270, LH = 480;
const rnd = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
function tex(w, h, paint, seed = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const r = rnd(seed); paint(g, r, w, h);
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  return t;
}
const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
function grain(g, r, w, h, n, cols, s = 1, x0 = 0, y0 = 0) { for (let i = 0; i < n; i++) px(g, x0 + (r() * w | 0), y0 + (r() * h | 0), 1 + (r() * s | 0), 1 + (r() * s | 0), cols[r() * cols.length | 0]); }
class Geo {
  constructor() { this.p = []; this.uv = []; }
  tri(a, b, c, ua = [0, 0], ub = [1, 0], uc = [1, 1]) { this.p.push(...a, ...b, ...c); this.uv.push(...ua, ...ub, ...uc); return this; }
  quad(a, b, c, d, ua = [0, 0], ub = [1, 0], uc = [1, 1], ud = [0, 1]) { return this.tri(a, b, c, ua, ub, uc).tri(a, c, d, ua, uc, ud); }
  hexa(f, uv = {}) {
    const P = (x, y, z) => f(x, y, z), q = (k, a, b, c, d) => { if (uv[k] === null) return; const [u0, v0, u1, v1] = uv[k] || uv.all || [0, 0, 1, 1]; this.quad(a, b, c, d, [u0, v0], [u1, v0], [u1, v1], [u0, v1]); };
    q('front', P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)); q('back', P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1));
    q('right', P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)); q('left', P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1));
    q('top', P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1)); q('bottom', P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1));
    return this;
  }
  box(w, h, d, cx = 0, cy = 0, cz = 0, uv = {}) { return this.hexa((x, y, z) => [cx + x * w / 2, cy + y * h / 2, cz + z * d / 2], uv); }
  loft(rings, segs, { map = 'cyl', cap0 = true, cap1 = true, rot = 0, box = null, vr = [0, 1], a0 = 0, a1 = Math.PI * 2 } = {}) {
    const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
    const A = (j) => a0 + (a1 - a0) * j / segs + rot, pt = (R, j) => { const a = A(j); return [(R.x || 0) + Math.sin(a) * R.rx, R.y, (R.z || 0) + Math.cos(a) * R.rz]; };
    const n = rings.length, y0 = rings[0].y, y1 = rings[n - 1].y;
    const bx = box || { x: Math.max(...rings.map((r) => r.rx)), y0, y1 };
    const uvOf = (p, j, i, back) => map === 'cyl' ? [j / segs, vr[0] + (vr[1] - vr[0]) * i / (n - 1)] : [(back ? .75 - p[0] / bx.x * .25 : .25 + p[0] / bx.x * .25), (p[1] - bx.y0) / (bx.y1 - bx.y0)];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
      const a = pt(rings[i], j), b = pt(rings[i], j + 1), c = pt(rings[i + 1], j + 1), d = pt(rings[i + 1], j), back = (a[2] + b[2] + c[2] + d[2]) / 4 < (rings[i].z || 0) - 1e-4;
      this.quad(a, b, c, d, uvOf(a, j, i, back), uvOf(b, j + 1, i, back), uvOf(c, j + 1, i + 1, back), uvOf(d, j, i + 1, back));
    }
    const cap = (R, i, up) => { const m = [R.x || 0, R.y, R.z || 0]; for (let j = 0; j < segs; j++) { const a = pt(R, j), b = pt(R, j + 1), back = (a[2] + b[2]) / 2 < m[2]; up ? this.tri(a, b, m, uvOf(a, j, i, back), uvOf(b, j + 1, i, back), uvOf(m, j + .5, i, back)) : this.tri(b, a, m, uvOf(b, j + 1, i, back), uvOf(a, j, i, back), uvOf(m, j + .5, i, back)); } };
    if (cap0 && full) cap(rings[0], 0, false); if (cap1 && full) cap(rings[n - 1], n - 1, true);
    return this;
  }
  get tris() { return this.p.length / 9; }
  build(seed = 7) { const g = new THREE.BufferGeometry(); this.fill(g, seed); return g; }
  fill(g, seed = 7) {
    const n = this.p.length / 3, C = new Float32Array(n * 3), N = new Float32Array(n * 3), R = new Float32Array(n * 3), B = new Float32Array(n * 3), r = rnd(seed);
    for (let t = 0; t < n; t += 3) {
      const q = this.p.slice(t * 3, t * 3 + 9), c = [0, 1, 2].map((k) => (q[k] + q[3 + k] + q[6 + k]) / 3);
      const u = [q[3] - q[0], q[4] - q[1], q[5] - q[2]], v = [q[6] - q[0], q[7] - q[1], q[8] - q[2]];
      const m = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...m) || 1, e = [r(), r(), r()];
      for (let k = 0; k < 3; k++) for (let a = 0; a < 3; a++) { const i = (t + k) * 3 + a; C[i] = c[a]; N[i] = m[a] / l; R[i] = e[a]; B[i] = a === k ? 1 : 0; }
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aC', new THREE.BufferAttribute(C, 3)); g.setAttribute('aN', new THREE.BufferAttribute(N, 3)); g.setAttribute('aR', new THREE.BufferAttribute(R, 3)); g.setAttribute('aB', new THREE.BufferAttribute(B, 3));
  }
}
const look = {
  uTex: { value: 1 }, uSnap: { value: 1.2 }, uAff: { value: 1 }, uSun: { value: new THREE.Vector3(.45, .75, .55).normalize() }, uSunC: { value: new THREE.Vector3(.60, .50, .34) },
  uAmbT: { value: new THREE.Vector3(.74, .72, .80) }, uAmbB: { value: new THREE.Vector3(.50, .46, .56) }, uFog: { value: new THREE.Vector3(.86, .55, .52) }, uFogA: { value: 0 }, uFogR: { value: new THREE.Vector2(14, 60) }, uT: { value: 0 },
};
const VS = `
attribute vec3 aC, aN, aR, aB; uniform float uSnap, uExp, uSide, uOpen, uShift; uniform mat4 uRoot, uRootI;
varying vec3 vWP, vRoot, vB; varying vec3 vUW; varying vec2 vUv; varying float vD;
mat3 rotA(vec3 ax, float a) { float c = cos(a), s = sin(a), o = 1. - c; return mat3(o*ax.x*ax.x+c, o*ax.x*ax.y+ax.z*s, o*ax.x*ax.z-ax.y*s, o*ax.x*ax.y-ax.z*s, o*ax.y*ax.y+c, o*ax.y*ax.z+ax.x*s, o*ax.x*ax.z+ax.y*s, o*ax.y*ax.z-ax.x*s, o*ax.z*ax.z+c); }
void main() {
  vec3 p = position;
  if (uExp > 0.) { vec3 ax = normalize(aR - .5 + 1e-3); p = aC + rotA(ax, uExp * (3. + 5. * aR.x)) * (p - aC) + (aN * (.35 + aR.y * .9) + (aR - .5) * .7) * uExp; }
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec4 rp = uRootI * wp; vRoot = rp.xyz;
  if (uSide != 0.) { vec3 hg = vec3(0., rp.y, -.34); vec3 d = rp.xyz - hg; float a = uSide * uOpen; float c = cos(a), s = sin(a); rp.xyz = hg + vec3(c * d.x + s * d.z, 0., -s * d.x + c * d.z); rp.x += uSide * uShift; rp.y = vRoot.y; wp = uRoot * rp; }
  vWP = wp.xyz; vec4 v = viewMatrix * wp; vD = -v.z; vec4 cp = projectionMatrix * v;
  if (uSnap > 0.) { vec2 g = vec2(${(LW / 2).toFixed(1)}, ${(LH / 2).toFixed(1)}) / uSnap; cp.xy = floor(cp.xy / cp.w * g + .5) / g * cp.w; }
  vUv = uv; vUW = vec3(uv * cp.w, cp.w); vB = aB; gl_Position = cp;
}`;
const FS = `
uniform sampler2D map; uniform vec3 uColor, uSun, uSunC, uAmbT, uAmbB, uFog, uInC; uniform vec2 uRep, uFogR; uniform float uWire, uTex, uAff, uEm, uSide, uFogA, uAlpha, uTexOwn, uExp, uFlash, uRed, uDim;
varying vec3 vWP, vRoot, vB; varying vec3 vUW; varying vec2 vUv; varying float vD;
void main() {
  if (uSide != 0. && uSide * vRoot.x < 0.) discard;
  vec2 uv = mix(vUv, vUW.xy / vUW.z, uAff) * uRep;
  vec4 t = texture2D(map, uv); float m = uTex * uTexOwn; if (m > .5 && t.a < .5) discard;
  vec3 base = mix(uColor, t.rgb, m);
  vec3 n = normalize(cross(dFdx(vWP), dFdy(vWP)));
  vec3 L = mix(uAmbB, uAmbT, n.y * .5 + .5) + uSunC * max(dot(n, uSun), 0.);
  vec3 c = base * mix(L, vec3(1.), uEm);
  if (!gl_FrontFacing && uSide != 0.) { float e = min(vB.x, min(vB.y, vB.z)); float w = fwidth(e) * 1.1; float l = 1. - smoothstep(0., w, e); c = mix(uInC * (.62 + .38 * clamp(-n.z, 0., 1.)), uInC * 2.0 + .16, l); }
  if (uSide != 0. && abs(vRoot.x) < .018) c = vec3(1., .42, .12);
  if (uWire > 0.) { float e = min(vB.x, min(vB.y, vB.z)); c = mix(c, vec3(1.), uWire * (1. - smoothstep(0., fwidth(e) * 1.5, e))); }
  c = mix(c, uFog, uFogA * smoothstep(uFogR.x, uFogR.y, vD)); c = mix(c, vec3(1., .23, .19), uRed) * uDim; c = mix(c, vec3(1.), uFlash);
  gl_FragColor = vec4(c, uAlpha);
}`;
const white = tex(1, 1, (g) => px(g, 0, 0, 1, 1, '#fff'));
function mat(o = {}, own = {}) {
  const [r, g, b] = hex(o.color ?? 0xffffff);
  return new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, side: o.side ?? THREE.DoubleSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true,
    uniforms: { ...look, uAff: { value: o.affine ?? 0 }, map: { value: o.map || white }, uTexOwn: { value: o.map ? 1 : 0 }, uColor: { value: new THREE.Vector3(r / 255, g / 255, b / 255) }, uRep: { value: new THREE.Vector2(...(o.rep || [1, 1])) }, uEm: { value: o.em ?? 0 }, uAlpha: { value: o.alpha ?? 1 }, uExp: { value: 0 }, uFlash: { value: 0 }, uRed: { value: 0 }, uDim: { value: 1 }, uWire: { value: 0 }, uSide: { value: 0 }, uOpen: { value: 0 }, uShift: { value: 0 }, uRoot: { value: new THREE.Matrix4() }, uRootI: { value: new THREE.Matrix4() }, uInC: { value: new THREE.Vector3(.30, .20, .34) }, ...own },
  });
}
const glc = document.createElement('canvas');
const gl = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true });
gl.setPixelRatio(1); gl.outputColorSpace = THREE.LinearSRGBColorSpace; gl.autoClear = true;
const RT = {}; const rt = (w, h, s) => RT[w] || (RT[w] = new THREE.WebGLRenderTarget(w, h, { samples: s, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.UnsignedByteType }));
const post = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { t: { value: null }, uD: { value: 1 }, uV: { value: .16 }, uL: { value: 23 } }, vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `uniform sampler2D t; uniform float uD, uV, uL; varying vec2 u;
  float b2(vec2 a){ a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); } float b4(vec2 a){ return b2(.5 * a) * .25 + b2(a); }
  void main(){ vec3 c = texture2D(t, u).rgb; vec2 q = u - .5; c *= 1. - uV * smoothstep(.1, .5, dot(q, q) * 1.2);
  vec3 d = floor(c * uL + b4(gl_FragCoord.xy)) / uL; gl_FragColor = vec4(mix(c, d, uD), 1.); }` });
const pScene = new THREE.Scene(); pScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post)); const pCam = new THREE.OrthographicCamera();
function shoot(ctx, scene, camera, { dither = 1, vig = .16, levels = 23 } = {}) {
  const r = rt(LW, LH, 0);
  if (glc.width !== LW || glc.height !== LH) gl.setSize(LW, LH, false);
  gl.setRenderTarget(r); gl.render(scene, camera); gl.setRenderTarget(null);
  post.uniforms.t.value = r.texture; post.uniforms.uD.value = dither; post.uniforms.uV.value = vig; post.uniforms.uL.value = levels; gl.render(pScene, pCam);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(glc, 0, 0, W, H);
}
return { W, H, LW, LH, rnd, hex, tex, px, grain, Geo, look, mat, gl, shoot };
})();

