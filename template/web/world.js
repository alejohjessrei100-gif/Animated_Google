// TEMPLATE world: the house-standard storybook street. Copy this, then add the story's own set pieces.
// House rules (see /CLAUDE.md): solid ground unless digging/underground matters; painted clouds; detailed houses; no text signs.
window.WORLD = (() => {
  const E = ENGINE, { add, box, group, toon, texM, scene } = E;
  const S = SCENERY.create(9), Wd = { S, life: S.life };
  const ZF = 0.25;                       // front edge of the "set" (street starts here)
  S.backdrop(); S.clouds(); S.farTown();
  // ground: grass everywhere (behind the street) + the street on a lid group (drop it away only for an underground reveal)
  const grassM = texM(PAINT.grass(6), 1, 1); grassM.map.wrapS = grassM.map.wrapT = THREE.RepeatWrapping;
  const g = new THREE.BoxGeometry(80, 1, 50); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2.4, p.getZ(i) / 2.4);
  add(g, grassM, 0, -0.5, ZF - 25, scene, { cast: false });
  Wd.lid = group(0, 0, 0); { const g2 = new THREE.BoxGeometry(80, 1.2, 40); const u2 = g2.attributes.uv, p2 = g2.attributes.position; for (let i = 0; i < p2.count; i++) u2.setXY(i, p2.getX(i) / 2.4, p2.getZ(i) / 2.4); add(g2, grassM, 0, -0.6, ZF + 20, Wd.lid, { cast: false }); }
  S.street(Wd.lid, ZF, { gaps: [[-1.8, 1.8]] });
  // two rows of detailed houses (front row along the street, second row behind it)
  S.houseRow([[-10.4, 2.9], [-7.2, 3.0], [-4.0, 2.8], [4.0, 2.9], [7.2, 3.0], [10.4, 2.8]], -1.2, 1);
  S.houseRow([[-12.4, 3.0], [-9.0, 2.8], [-5.6, 3.1], [-2.2, 2.9], [1.2, 3.0], [4.6, 2.8], [8.0, 3.1], [11.4, 2.9]], -8.6, 20, 1.2);
  S.smoke();
  for (let k = 0; k < 6; k++) S.tree(-16 + k * 6.4, -5 - S.R() * 2, scene);
  Wd.tick = (t) => S.tick(t);
  return Wd;
})();
