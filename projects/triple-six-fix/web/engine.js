// Render core: three.js scene, toon materials, ink (normal+depth edges), grade, depth of field, face glow, whip blur.
// Adapted from the Ricks Clips Style Kit engine (engine/web/main_template.js). Classic script; exposes window.ENGINE.
window.ENGINE = (() => {
  const E = {};
  let W = 1080, H = 1920;
  const rx = (a) => a * Math.PI / 180;
  E.rx = rx;

  // ---------- materials ----------
  const grad = (() => { const d = new Uint8Array([120, 120, 120, 255, 205, 205, 205, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  // painted look: soft standard shading + a world-space brush-grain that breaks up flat colour
  const PAINT_VS = 'varying vec3 vWP;\n';
  const PAINT_FS = `varying vec3 vWP;
    float ph(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
    float pn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(ph(i),ph(i+vec3(1,0,0)),f.x),mix(ph(i+vec3(0,1,0)),ph(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(ph(i+vec3(0,0,1)),ph(i+vec3(1,0,1)),f.x),mix(ph(i+vec3(0,1,1)),ph(i+vec3(1,1,1)),f.x),f.y),f.z); }
  `;
  const painted = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = PAINT_VS + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = PAINT_FS + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  float g1 = pn(vWP * 7.0), g2 = pn(vWP * 31.0 + 3.1);\n  diffuseColor.rgb *= 0.9 + 0.12 * g1 + 0.06 * g2;');
    };
    m.customProgramCacheKey = () => 'painted' + (m.map ? 'm' : '') + (m.transparent ? 't' : '');
    return m;
  };
  const toon = (opts) => { const o = { ...opts }; delete o.gradientMap; return painted(new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.0, ...o })); };
  E.toon = toon;
  const matCache = {};
  const METAL = new Set(['#b6bec7', '#c9ced6', '#d8dde6', '#9aa0aa', '#7f8896', '#c9a24a', '#e6c25a', '#e5c158', '#c0c6d0', '#3b3f4a']);
  E.col = (c) => matCache[c] || (matCache[c] = METAL.has(c) ? toon({ color: c, metalness: 0.6, roughness: 0.32 }) : toon({ color: c }));
  // normal map from a painted texture: luminance = height, Sobel = slope (bricks, planks, panels and tiles get real grooves)
  const nCache = new Map();
  const normalFrom = (canvas, strength = 2.2) => {
    if (nCache.has(canvas)) return nCache.get(canvas);
    const w = canvas.width, h = canvas.height, src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const at = (x, y) => L[((y + h) % h) * w + ((x + w) % w)];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * strength;
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; nCache.set(canvas, t); return t;
  };
  E.texM = (canvas, rx_ = 1, ry_ = 1, color = '#ffffff', o = {}) => { const map = PAINT.tex(canvas, rx_, ry_), nm = normalFrom(canvas).clone(); nm.repeat.set(rx_, ry_); nm.needsUpdate = true;
    return toon({ map, color, normalMap: nm, normalScale: new THREE.Vector2(0.7, 0.7), roughness: o.roughness ?? 0.8, metalness: o.metalness ?? 0 }); };
  // real glass: physical transmission (bends what is behind it, sharp sun glints)
  E.glass = () => new THREE.MeshPhysicalMaterial({ color: '#f2fbff', metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.35, ior: 1.45, specularIntensity: 1, side: THREE.FrontSide });
  // planar mirror floors (studio gloss, polished wood): the scene is re-rendered mirrored and blended with a fresnel-ish weight
  E.reflectors = [];
  const reflU = { reflTex: { value: null }, reflRes: { value: new THREE.Vector2(1, 1) } };
  E.reflective = (m, k = 0.3, set = null) => { const pb = m.onBeforeCompile;
    m.onBeforeCompile = (sh) => { pb(sh); sh.uniforms.reflTex = reflU.reflTex; sh.uniforms.reflRes = reflU.reflRes; sh.uniforms.reflK = { value: k };
      sh.fragmentShader = 'uniform sampler2D reflTex; uniform vec2 reflRes; uniform float reflK;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
  { vec2 ruv = gl_FragCoord.xy / reflRes + (vec2(pn(vWP * 9.0), pn(vWP * 9.0 + 5.)) - .5) * .006;
    vec3 rc = texture2D(reflTex, ruv).rgb; float fr = reflK * (0.55 + 0.45 * pow(1. - abs(normalize(vViewPosition).y), 2.));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, rc, fr * (1. - roughnessFactor * 0.4)); }`); };
    m.customProgramCacheKey = () => 'refl' + k; m.roughness = 0.35; return m; };
  E.addReflector = (mesh, set) => { mesh.userData.reflector = set; E.reflectors.push(mesh); };

  // ---------- ink / normal-depth contract ----------
  const ndMat = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
    side: THREE.DoubleSide,
  });
  const ndInst = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; varying float vD; void main(){ mat4 m = modelViewMatrix*instanceMatrix; vN = normalize(mat3(m)*normal); vec4 mv = m*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
    side: THREE.DoubleSide,
  });
  E.cardNd = (map) => new THREE.ShaderMaterial({
    uniforms: { map: { value: map } },
    vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
    side: THREE.DoubleSide,
  });

  // ---------- scene ----------
  const scene = new THREE.Scene(); E.scene = scene;
  const camera = new THREE.PerspectiveCamera(40, 9 / 16, 0.05, 800); E.camera = camera;
  const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);
  scene.fog = new THREE.Fog('#ffffff', 30, 120);

  // ---------- helpers ----------
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? E.col(mat) : mat); m.position.set(x, y, z);
    m.castShadow = opts.cast ?? true; m.receiveShadow = true; if (opts.noink) m.userData.ndSkip = true; parent.add(m); return m;
  };
  E.add = add;
  E.box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  E.tbox = (w, h, d, t = 2) => {
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
    return g;
  };
  E.group = (x = 0, y = 0, z = 0, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // canvas label texture with auto-fit text (signs never overflow their board)
  E.label = (lines, { w = 1024, h = 512, bg = '#f3e6c4', fg = '#2b1f1c', border = '#2b1f1c', font = 'Lilita One', pad = 40, bulbs = false, stripe = null } = {}) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (stripe) { g.fillStyle = stripe; g.fillRect(0, h * 0.78, w, h * 0.12); }
    if (border) { g.lineWidth = Math.min(w, h) * 0.05; g.strokeStyle = border; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
    const L = Array.isArray(lines) ? lines : [lines];
    const lh = (h - pad * 2) / L.length;
    L.forEach((t, i) => {
      const txt = typeof t === 'string' ? t : t.t, col = typeof t === 'string' ? fg : (t.c || fg);
      let fs = lh * 0.86; g.font = `${fs}px "${font}", Impact, sans-serif`;
      const mw = g.measureText(txt).width; if (mw > w - pad * 2) { fs *= (w - pad * 2) / mw; g.font = `${fs}px "${font}", Impact, sans-serif`; }
      g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, pad + lh * (i + 0.5) + fs * 0.04);
    });
    if (bulbs) { const n = Math.round(w / 64); for (let i = 0; i < n; i++) for (const y of [14, h - 14]) { g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(32 + i * (w - 64) / (n - 1), y, 9, 0, 7); g.fill(); } }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  // a framed sign board (3D box, inked) with a label face
  E.sign = (parent, lines, x, y, z, w, h, opts = {}) => {
    const g = E.group(x, y, z, parent); if (opts.ry) g.rotation.y = opts.ry; if (opts.rz) g.rotation.z = opts.rz; if (opts.rx) g.rotation.x = opts.rx;
    const tex = E.label(lines, { w: 1024, h: Math.round(1024 * h / w), ...opts });
    const face = opts.glow ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : toon({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.9 });
    if (opts.glow) face.userData.bloomK = opts.glow === true ? 0.9 : opts.glow;
    const side = E.col(opts.frame || '#5a3a24');
    const m = add(new THREE.BoxGeometry(w, h, opts.d ?? 0.06), [side, side, side, side, opts.unlit === false ? toon({ map: tex }) : face, side], 0, 0, 0, g);
    g.userData.face = face; g.userData.mesh = m; return g;
  };

  // ---------- cards (2D characters, unlit: faces stay pure white) ----------
  const CW = 1200, CH = 2000, CM = 2.25;
  const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
  const blobTex = PAINT.tex(PAINT.radial('20,14,30', 0.55));
  class Card {
    constructor() {
      this.c = document.createElement('canvas'); this.c.width = CW; this.c.height = CH; this.g = this.c.getContext('2d');
      this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 8;
      this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: false, toneMapped: false });
      this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = E.cardNd(this.t); this.mesh.castShadow = true;
      this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
      this.mesh.userData.bloomMat = new THREE.MeshBasicMaterial({ color: '#000000', map: this.t, alphaTest: 0.5, side: THREE.DoubleSide });
      this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
      this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
      scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
    }
    draw(key, fn) {
      if (key === this.key) return; this.key = key;
      const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
      fn(g); this.t.needsUpdate = true;
    }
  }
  const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());
  E.drawActors = (list) => {
    cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
    list.forEach((a, i) => {
      const c = getCard(i); c.draw(a.key, a.draw);
      c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
      // a card closer than 0.75 m to the lens would be sliced by the near plane: never draw a half character
      if (Math.hypot(camera.position.x - a.x, camera.position.z - a.z) < 0.75) { c.mesh.visible = false; return; }
      const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s * (1 - (a.sq || 0)), s);
      c.mesh.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z) + (a.yaw || 0), a.roll || 0);
      c.mat.opacity = a.alpha ?? 1; c.mesh.renderOrder = a.order || 2;
      if (a.blob !== false) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? 0) + 0.015, a.z); c.blob.scale.set(0.9 * s, 0.55 * s, 1); }
    });
  };

  // ---------- post ----------
  let rtColor, rtNd, rtInk, rtDof, rtG1, rtG2, rtAO, rtAO2, rtE, rtQ1, rtQ2, rtO1, rtO2, rtAA, rtRefl;
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
  const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
  const VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
  const inkU = { col: { value: null }, nd: { value: null }, res: { value: new THREE.Vector2() }, px: { value: 2.5 }, sat: { value: 1.1 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.18 }, flash: { value: 0 }, ao: { value: 0.62 }, aoT: { value: null } };
  const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: VS,
    fragmentShader: `uniform sampler2D col, nd, aoT; uniform vec2 res; uniform float px, sat, vig, flash, ao; uniform vec3 lift, gain; varying vec2 vUv;
    float aoAt(vec2 uv){
      vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; float occ = 0.;
      float R = 0.35 / d * res.y * 0.9;
      for (int i=0;i<16;i++){ float fi = float(i); float r = (fi+1.)/16.; float a = fi*2.39996;
        vec2 o = vec2(cos(a), sin(a)) * R * r / res; vec4 s = texture2D(nd, uv + o); float ds = s.a; if (ds <= 0.) continue;
        float dz = d - ds; occ += smoothstep(0.02, 0.12, dz) * (1. - smoothstep(0.35, 0.9, dz)); }
      return occ / 16.;
    }
    float edgeAt(vec2 uv, float r){
      vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
      float e = 0.; float rr = r * clamp(4./d, .6, 1.3);
      for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
        vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
        float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
        if (card && ds > 0.) continue;
        if (card) ds = 1e4;
        vec3 ns = s.rgb*2.-1.;
        e = max(e, smoothstep(.01, .03, (ds - d)/d));
        if (!card && abs(ds-d)/d < .05) e = max(e, smoothstep(.85, .68, dot(n, ns)) * .9);
      }
      return e * (1. - smoothstep(30., 120., d)*.7);
    }
    void main(){
      vec3 c = texture2D(col, vUv).rgb;
      float e = edgeAt(vUv, px);
      c *= 1. - ao * texture2D(aoT, vUv).r;
      c = mix(c, vec3(.028,.018,.016), e);
      float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat + .18 * (1. - smoothstep(0., .35, l)));   // shadows keep their hue, slightly richer (measured on the reference)
      c = c*gain + lift;
      vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.6), q*vec2(1.,.6))*2.2;
      c = mix(c, vec3(1.), flash);
      gl_FragColor = vec4(c,1.); }` }));
  const dofU = { src: { value: null }, nd: { value: null }, res: { value: new THREE.Vector2() }, focus: { value: 5 }, cinf: { value: 0 } };
  const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf; varying vec2 vUv;
    float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 400.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*.6, cinf*1.2); }
    void main(){
      float c0 = coc(vUv);
      if (cinf < .5 || c0 < .6) { gl_FragColor = vec4(texture2D(src, vUv).rgb, 1.); return; }
      vec3 acc = vec3(0.); float wsum = 0.;
      for (int i=0;i<40;i++){ float fi = float(i); float r = sqrt((fi+.5)/40.); float a = fi*2.39996;
        vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
        float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
        acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
      gl_FragColor = vec4(acc/max(wsum,1e-3), 1.); }` }));
  // ambient occlusion at half resolution: 24 rotated samples, world-scaled radius, then a depth-aware blur
  const aoU = { nd: { value: null }, res: { value: new THREE.Vector2() }, proj: { value: 1 } };
  const aoScene = fs(new THREE.ShaderMaterial({ uniforms: aoU, vertexShader: VS,
    fragmentShader: `uniform sampler2D nd; uniform vec2 res; uniform float proj; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec4 c = texture2D(nd, vUv); if (dot(c.rgb,c.rgb) < .01 || c.a <= 0.) { gl_FragColor = vec4(0.); return; }
      float d = c.a; vec3 n = c.rgb*2.-1.; float R = 0.45 * proj / d; float rot = h(gl_FragCoord.xy) * 6.283; float occ = 0., wsum = 0.;
      for (int i=0;i<24;i++){ float fi = float(i); float r = sqrt((fi+.5)/24.); float a = fi*2.39996 + rot;
        vec2 o = vec2(cos(a), sin(a)) * R * r / res; vec4 s = texture2D(nd, vUv + o); float ds = s.a; if (ds <= 0.) continue;
        float dz = d - ds; float w = 1. - smoothstep(0.25, 0.8, dz);
        occ += smoothstep(0.015, 0.1, dz) * w; wsum += 1.; }
      gl_FragColor = vec4(occ / max(wsum, 1.), d, 0., 1.); }` }));
  const aoBU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
  const aoBlur = fs(new THREE.ShaderMaterial({ uniforms: aoBU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec2 c0 = texture2D(src, vUv).rg; float a = 0., ws = 0.;
      for (int i=-4;i<=4;i++){ vec2 s = texture2D(src, vUv + dir*float(i)*1.5).rg; float w = exp(-float(i*i)/8.) * (1. - smoothstep(.0, .06, abs(s.g - c0.g)/max(c0.g,.01))); a += s.r*w; ws += w; }
      gl_FragColor = vec4(a/max(ws,1e-3), c0.g, 0., 1.); }` }));
  // FXAA on the graded image (on top of 1.5x supersampling)
  const aaU = { src: { value: null }, res: { value: new THREE.Vector2() } };
  const aaScene = fs(new THREE.ShaderMaterial({ uniforms: aaU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src; uniform vec2 res; varying vec2 vUv;
    float lu(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
    void main(){ vec2 px = 1./res; vec3 cM = texture2D(src, vUv).rgb;
      float lNW = lu(texture2D(src, vUv+vec2(-1.,-1.)*px).rgb), lNE = lu(texture2D(src, vUv+vec2(1.,-1.)*px).rgb), lSW = lu(texture2D(src, vUv+vec2(-1.,1.)*px).rgb), lSE = lu(texture2D(src, vUv+vec2(1.,1.)*px).rgb), lM = lu(cM);
      float mn = min(lM, min(min(lNW,lNE), min(lSW,lSE))), mx = max(lM, max(max(lNW,lNE), max(lSW,lSE)));
      vec2 dir = vec2(-((lNW+lNE)-(lSW+lSE)), ((lNW+lSW)-(lNE+lSE)));
      float red = max((lNW+lNE+lSW+lSE)*.03125, 1./128.); float rc = 1./(min(abs(dir.x),abs(dir.y))+red); dir = clamp(dir*rc, -8., 8.)*px;
      vec3 A = .5*(texture2D(src, vUv+dir*(1./3.-.5)).rgb + texture2D(src, vUv+dir*(2./3.-.5)).rgb);
      vec3 B = A*.5 + .25*(texture2D(src, vUv+dir*-.5).rgb + texture2D(src, vUv+dir*.5).rgb);
      float lB = lu(B); gl_FragColor = vec4((lB < mn || lB > mx) ? A : B, 1.); }` }));
  const brightU = { src: { value: null } };
  const brightScene = fs(new THREE.ShaderMaterial({ uniforms: brightU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; c = pow(max(c, 0.), vec3(1./2.2)); gl_FragColor = vec4(max(c - .5, 0.)*2., 1.); }` }));
  const blurU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
  const blurScene = fs(new THREE.ShaderMaterial({ uniforms: blurU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 a = vec3(0.); float ws = 0.;
      for (int i=-12;i<=12;i++){ float x = float(i); float w = exp(-x*x/(2.*25.)); a += texture2D(src, vUv + dir*x).rgb*w; ws += w; } gl_FragColor = vec4(a/ws, 1.); }` }));
  const finU = { src: { value: null }, glow: { value: null }, gk: { value: 0.4 }, whip: { value: new THREE.Vector2() }, seed: { value: 0 }, bloomA: { value: null }, bloomB: { value: null }, bloomK: { value: 1.0 }, ca: { value: 0 }, expo: { value: 1.32 } };
  const finScene = fs(new THREE.ShaderMaterial({ uniforms: finU, vertexShader: VS,
    fragmentShader: `uniform sampler2D src, glow, bloomA, bloomB; uniform float gk, seed, bloomK, ca, expo; uniform vec2 whip; varying vec2 vUv;
    vec3 samp(vec2 uv){ if (ca < .0002) return texture2D(src, uv).rgb; vec2 d = (uv - .5) * ca; return vec3(texture2D(src, uv + d).r, texture2D(src, uv).g, texture2D(src, uv - d).b); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
    void main(){
      vec3 c = vec3(0.);
      if (length(whip) > .0005) { for (int i=0;i<24;i++){ float t = float(i)/23. - .5; c += samp(vUv + whip*t); } c /= 24.; }
      else c = samp(vUv);
      c += min(texture2D(bloomA, vUv).rgb * .42 + texture2D(bloomB, vUv).rgb * .34, vec3(.6)) * bloomK;          // bloom: only emissive sources
      c = aces(c * expo);                                                                              // filmic tone mapping
      c = pow(max(c, 0.), vec3(1./2.2));
      vec3 g = texture2D(glow, vUv).rgb;
      c = 1. - (1. - c)*(1. - g*gk);
      c = mix(c, c*c*(3.-2.*c), .22);                                  // gentle S-curve
      float l = dot(c, vec3(.299,.587,.114)); c += vec3(.025,.01,-.015)*smoothstep(.45,1.,l);       // warm highlights; shadows keep their own hue
      c += (fract(sin(dot(vUv*vec2(913.,577.)+seed, vec2(12.9898,78.233)))*43758.5453)-.5)*.018; // fine film grain
      gl_FragColor = vec4(c, 1.); }` }));
  finScene.children[0].material.toneMapped = false;

  E.init = (canvas, w, h, ss = 1) => {
    W = Math.round(w * ss); H = Math.round(h * ss);
    E.renderer = E.renderer || new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    const r = E.renderer; r.setPixelRatio(1); r.setSize(W, H, false);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    [rtColor, rtNd, rtInk, rtDof, rtG1, rtG2, rtAO, rtAO2, rtE, rtQ1, rtQ2, rtO1, rtO2, rtAA, rtRefl].forEach((t) => t && t.dispose());
    const HF = { type: THREE.HalfFloatType };
    rtAO = new THREE.WebGLRenderTarget(W >> 1, H >> 1, HF); rtAO2 = new THREE.WebGLRenderTarget(W >> 1, H >> 1, HF);
    rtE = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { ...HF, samples: 2 }); rtQ1 = new THREE.WebGLRenderTarget(W >> 2, H >> 2, HF); rtQ2 = new THREE.WebGLRenderTarget(W >> 2, H >> 2, HF);
    rtO1 = new THREE.WebGLRenderTarget(W >> 3, H >> 3, HF); rtO2 = new THREE.WebGLRenderTarget(W >> 3, H >> 3, HF);
    rtAA = new THREE.WebGLRenderTarget(W, H, HF); rtRefl = new THREE.WebGLRenderTarget(W >> 1, H >> 1, { ...HF, samples: 2 });
    reflU.reflTex.value = rtRefl.texture; reflU.reflRes.value.set(W, H);
    aoU.nd.value = null; aaU.res.value.set(W, H);
    rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
    rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
    rtDof = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
    rtG1 = new THREE.WebGLRenderTarget(W >> 2, H >> 2, { type: THREE.HalfFloatType });
    rtG2 = new THREE.WebGLRenderTarget(W >> 2, H >> 2, { type: THREE.HalfFloatType });
    inkU.col.value = rtColor.texture; inkU.nd.value = rtNd.texture; inkU.res.value.set(W, H); inkU.aoT.value = rtAO.texture; aoU.nd.value = rtNd.texture; aoU.res.value.set(W >> 1, H >> 1);
    dofU.src.value = rtInk.texture; dofU.nd.value = rtNd.texture; dofU.res.value.set(W, H);
    camera.aspect = W / H;
  };

  const swapForNd = (on) => {
    scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      if (on) {
        o.userData.mat0 = o.material;
        if (o.userData.ndSkip || !o.visible) { o.userData.vis0 = o.visible; o.visible = false; return; }
        o.material = o.userData.nd || (o.isInstancedMesh ? ndInst : ndMat);
      } else {
        o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
      }
    });
  };

  const BLACK = new THREE.MeshBasicMaterial({ color: '#000000' }), bloomCache = new WeakMap(), tc = new THREE.Color();
  const bloomOf = (m, o) => {
    if (!m) return BLACK; if (m.userData && m.userData.bloomK) { let b = bloomCache.get(m); if (!b) { b = new THREE.MeshBasicMaterial({ map: m.map || null, color: '#ffffff' }); bloomCache.set(m, b); } b.map = m.map || null; b.color.setScalar(m.userData.bloomK); return b; }
    if (m.isMeshStandardMaterial && !m.emissiveMap && m.emissiveIntensity >= 0.5 && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.3) { let b = bloomCache.get(m); if (!b) { b = new THREE.MeshBasicMaterial(); bloomCache.set(m, b); } b.color.copy(m.emissive).multiplyScalar(Math.min(1.6, (m.emissiveIntensity - 0.4) * 1.1)); return b; }
    return BLACK; };
  const swapForBloom = (on) => {
    scene.traverse((o) => {
      if (!o.isMesh) return;
      if (on) { o.userData.mat1 = o.material; if (o.userData.ndSkip && !o.userData.bloomMat) { o.userData.vis1 = o.visible; o.visible = false; return; }
        o.material = o.userData.bloomMat || (Array.isArray(o.material) ? o.material.map((m) => bloomOf(m, o)) : bloomOf(o.material, o)); }
      else { o.material = o.userData.mat1; if (o.userData.vis1 !== undefined) { o.visible = o.userData.vis1; delete o.userData.vis1; } }
    });
  };
  E.placeCamera = (C) => { camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0)); camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); };
  E.cards = () => cards;
  const tmpV = new THREE.Vector3();
  // F = { cam:{pos,look,fov,roll}, light:{...}, dof:{focus,cinf}, flash, whip:[x,y], actors:[] }
  E.render = (F) => {
    const r = E.renderer, L = F.light, C = F.cam;
    hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
    sun.color.set(L.sun); sun.intensity = L.sunI;
    fill.color.set(L.fillCol || '#ffffff'); fill.intensity = L.fillI || 0;
    scene.fog.color.set(L.fog); scene.fog.near = L.fogNear ?? 25; scene.fog.far = L.fogFar ?? 90;
    r.setClearColor(L.bg || L.fog, 1);
    inkU.sat.value = L.sat ?? 1.1; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000'); inkU.vig.value = L.vig ?? 0.18;
    E.placeCamera(C);
    const focus = new THREE.Vector3(...C.look);
    const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    sun.position.copy(focus).addScaledVector(tmpV, 30); sun.target.position.copy(focus);
    const sc = sun.shadow.camera, ext = L.shadowExt || 9; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 80; sc.updateProjectionMatrix();
    fill.position.set(C.pos[0] * 0.6 + C.look[0] * 0.4, C.pos[1] + 1.2, C.pos[2] * 0.6 + C.look[2] * 0.4);
    E.drawActors(F.actors);
    // mirror pass for glossy floors of the current set (scene flipped about y = 0; three flips the winding for us)
    const refl = E.reflectors.filter((m) => m.userData.reflector === F.cam.set);
    if (refl.length) {
      refl.forEach((m) => { m.visible = false; }); const sm0 = r.shadowMap.enabled; r.shadowMap.enabled = false;
      scene.scale.y = -1; scene.updateMatrixWorld(true); r.setRenderTarget(rtRefl); r.setClearColor(L.bg || L.fog, 1); r.clear(); r.render(scene, camera);
      scene.scale.y = 1; scene.updateMatrixWorld(true); r.shadowMap.enabled = sm0; refl.forEach((m) => { m.visible = true; });
    }
    r.setRenderTarget(rtColor); r.setClearColor(L.bg || L.fog, 1); r.clear(); r.render(scene, camera);
    const fog = scene.fog; scene.fog = null; const sm = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false;
    swapForNd(true); r.setRenderTarget(rtNd); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, camera); swapForNd(false);
    scene.fog = fog; r.shadowMap.autoUpdate = sm;
    inkU.px.value = 3.2 * W / 1080; inkU.flash.value = F.flash || 0; finU.seed.value = (F.t || 0) % 17;
    aoU.proj.value = (H >> 1) / (2 * Math.tan(camera.fov * Math.PI / 360));
    r.setRenderTarget(rtAO); r.render(aoScene, fsCam);
    aoBU.src.value = rtAO.texture; aoBU.dir.value.set(1 / (W >> 1), 0); r.setRenderTarget(rtAO2); r.render(aoBlur, fsCam);
    aoBU.src.value = rtAO2.texture; aoBU.dir.value.set(0, 1 / (H >> 1)); r.setRenderTarget(rtAO); r.render(aoBlur, fsCam);
    r.setRenderTarget(rtInk); r.render(inkScene, fsCam);
    dofU.focus.value = F.dof.focus; dofU.cinf.value = F.dof.cinf * W / 1080;
    r.setRenderTarget(rtDof); r.render(dofScene, fsCam);
    aaU.src.value = rtDof.texture; r.setRenderTarget(rtAA); r.render(aaScene, fsCam);
    // emissive bloom: draw only glowing things (everything else black, still depth-tested), then two blur scales
    swapForBloom(true); r.setRenderTarget(rtE); r.setClearColor(0x000000, 1); r.clear(); const fg = scene.fog; scene.fog = null; const sm2 = r.shadowMap.autoUpdate; r.shadowMap.autoUpdate = false; r.render(scene, camera); scene.fog = fg; r.shadowMap.autoUpdate = sm2; swapForBloom(false);
    blurU.src.value = rtE.texture; blurU.dir.value.set(1.5 / (W >> 2), 0); r.setRenderTarget(rtQ1); r.render(blurScene, fsCam);
    blurU.src.value = rtQ1.texture; blurU.dir.value.set(0, 1.5 / (H >> 2)); r.setRenderTarget(rtQ2); r.render(blurScene, fsCam);
    blurU.src.value = rtQ2.texture; blurU.dir.value.set(2.5 / (W >> 3), 0); r.setRenderTarget(rtO1); r.render(blurScene, fsCam);
    blurU.src.value = rtO1.texture; blurU.dir.value.set(0, 2.5 / (H >> 3)); r.setRenderTarget(rtO2); r.render(blurScene, fsCam);
    finU.bloomA.value = rtQ2.texture; finU.bloomB.value = rtO2.texture; finU.ca.value = F.ca || 0; finU.expo.value = L.expo ?? 1.6;
    brightU.src.value = rtDof.texture; r.setRenderTarget(rtG1); r.render(brightScene, fsCam);
    blurU.src.value = rtG1.texture; blurU.dir.value.set(1 / (W >> 2), 0); r.setRenderTarget(rtG2); r.render(blurScene, fsCam);
    blurU.src.value = rtG2.texture; blurU.dir.value.set(0, 1 / (H >> 2)); r.setRenderTarget(rtG1); r.render(blurScene, fsCam);
    finU.src.value = rtAA.texture; finU.glow.value = rtG1.texture; finU.whip.value.set(...(F.whip || [0, 0]));
    r.setRenderTarget(null); r.render(finScene, fsCam);
  };
  return E;
})();
