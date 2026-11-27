window.auditCards = (step = 3) => {
  const E = ENGINE, cam = E.camera, out = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const solids = () => { const L = []; E.scene.traverse((o) => { if (!o.isMesh || !o.visible || o.userData.ndSkip) return; let p = o.parent, vis = true; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (!vis) return;
      if (o.material && (o.material.transparent && o.material.opacity < 0.5)) return; const b = new THREE.Box3().setFromObject(o); const sz = b.getSize(V()); if (sz.x < 0.06 || sz.y < 0.06 || sz.z < 0.06) return; if (sz.y < 0.16 && b.max.y < 0.25) return; if (o.geometry.type === 'TubeGeometry') return; if (Math.min(sz.x, sz.y, sz.z) < 0.09 && b.getSize(V()).length() < 0.4) return; if (b.max.y < 0.02) return; L.push([b, o]); }); return L; };
  const cards = E.cards();
  for (let f = 0; f < STORY.TOTAL; f += step) {
    const F = STORY.frame(f); E.placeCamera(F.cam); E.drawActors(F.actors);
    const cardSet = new Set(cards.map((c) => c.mesh).concat(cards.map((c) => c.blob)));
    const S = solids().filter(([b, o]) => !cardSet.has(o) && o.geometry.type !== 'PlaneGeometry');
    F.actors.forEach((a, i) => {
      const c = cards[i], id = a.key.match(/^[a-zA-Z0-9]+/)[0], sit = a.key.includes('"pose":"sit"'), kid = /^(kid|hero)/.test(id);
      const s = a.s || 1, yaw = c.mesh.rotation.y, rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const H = sit ? [0.15, 0.35, 0.55, 0.75, 0.9] : kid ? [0.2, 0.5, 0.8, 1.0, 1.15] : [0.15, 0.45, 0.75, 1.0, 1.2, 1.38, 1.55];
      const hits = new Set();
      for (const h of H) for (const dx of [-0.14, 0, 0.14]) { const p = V(a.x + rx * dx * s, a.y + h * s, a.z + rz * dx * s); for (const [b, o] of S) if (b.containsPoint(p)) { hits.add((o.parent && o.parent.name) || o.geometry.type + '@' + b.min.x.toFixed(2) + ',' + b.min.y.toFixed(2) + ',' + b.min.z.toFixed(2) + ' h' + h); } }
      // frame edge: head
      const headY = sit ? 0.72 : kid ? 1.0 : 1.34, headR = 0.26 * s;
      const hc = V(a.x, a.y + headY * s, a.z), dist = hc.distanceTo(cam.position), pr = hc.clone().project(cam);
      const inFront = pr.z < 1 && pr.z > -1; const rNdcY = headR / (Math.tan(cam.fov * Math.PI / 360) * dist), rNdcX = rNdcY / cam.aspect;
      let edge = null;
      if (inFront && Math.abs(pr.x) < 1 + rNdcX && Math.abs(pr.y) < 1 + rNdcY) { if (Math.abs(pr.x) > 1 - rNdcX || pr.y > 1 - rNdcY || pr.y < -1 + rNdcY) edge = 'head-cut-by-frame'; }
      if (inFront && dist < 0.9) edge = 'too-close(' + dist.toFixed(2) + 'm)';
      if (hits.size || edge) out.push({ f, t: +(f / 30).toFixed(2), id, set: F.cam.set, hits: [...hits].slice(0, 3), edge });
    });
  }
  return out;
};
