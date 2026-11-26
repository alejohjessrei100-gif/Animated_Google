// Sets & mechanism props: street, the pigs' brick house, hanging bell, electric bell board.
import React from 'react';
import * as THREE from 'three';
import {M, flat, box, cyl, cone, ico, torus, flashMat, GREEN, RED, pop} from './lowpoly';

// ---------- environment (desaturated) ----------
const Tree: React.FC<{p: [number, number, number]; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <M geo={cyl(0.12, 0.16, 1.0, 5)} mat={flat('#7D6A55')} p={[0, 0.5, 0]} />
    <M geo={cone(0.9, 1.6, 6)} mat={flat('#8FA584')} p={[0, 1.7, 0]} />
    <M geo={cone(0.7, 1.2, 6)} mat={flat('#9DB291')} p={[0, 2.45, 0]} />
  </group>
);

export const Ground: React.FC = () => (
  <>
    <M geo={box(80, 0.2, 80)} mat={flat('#A9B79C')} p={[0, -0.1, 0]} />
    <M geo={box(40, 0.04, 2.2)} mat={flat('#CFCBC2')} p={[0, 0.02, 4.2]} />
    <M geo={box(40, 0.02, 6)} mat={flat('#8E8F92')} p={[0, 0.005, 8.5]} />
    <M geo={box(1.6, 0.03, 3.2)} mat={flat('#D8D2C4')} p={[0, 0.015, 1.6]} />
    {/* doormat */}
    <M geo={box(1.0, 0.03, 0.55)} mat={flat('#A4573A')} p={[0, 0.035, 0.45]} />
    <Tree p={[-5.2, 0, -1]} s={1.3} />
    <Tree p={[5.6, 0, -0.5]} s={1.1} />
    <Tree p={[-7.5, 0, -4]} s={1.6} />
    <Tree p={[8, 0, -5]} s={1.5} />
    {/* picket fence */}
    {Array.from({length: 18}).map((_, i) => {
      const x = -9 + i * 0.5; if (Math.abs(x) < 1.2) return null;
      return <M key={i} geo={box(0.12, 0.7, 0.05)} mat={flat('#E6E1D6')} p={[x, 0.35, 3.0]} />;
    })}
    <M geo={box(7.6, 0.08, 0.04)} mat={flat('#E6E1D6')} p={[-5.0, 0.5, 3.0]} />
    <M geo={box(7.6, 0.08, 0.04)} mat={flat('#E6E1D6')} p={[5.0, 0.5, 3.0]} />
  </>
);

// ---------- brick house ----------
const GABLE = (() => {
  const sh = new THREE.Shape([new THREE.Vector2(-2, 0), new THREE.Vector2(2, 0), new THREE.Vector2(0, 1.7)]);
  return new THREE.ExtrudeGeometry(sh, {depth: 6.4, bevelEnabled: false}).rotateY(Math.PI / 2);
})();
const BRICK = '#B47A68', BRICK2 = '#A66B5A', TRIM = '#EFEBE2';
export type HouseState = {doorAngle: number; doorGone: boolean; doorFly: number; lightsOn: number; planks: boolean};

export const House: React.FC<{s: HouseState}> = ({s}) => {
  const W = 6.4, H = 3.4;
  // wall pieces around door (x -0.5..0.5, y 0..2.1) and window (x 1.3..2.5, y 1.0..2.1)
  const walls: [number, number, number, number][] = [ // x0,x1,y0,y1
    [-W / 2, -0.5, 0, H], [-0.5, 0.5, 2.1, H], [0.5, 1.3, 0, H], [1.3, 2.5, 0, 1.0], [1.3, 2.5, 2.1, H], [2.5, W / 2, 0, H],
  ];
  // brick courses for texture
  const courses = Array.from({length: 9}).map((_, i) => 0.2 + i * 0.36);
  const flyT = s.doorFly;
  return (
    <group>
      {walls.map(([x0, x1, y0, y1], i) => (
        <M key={i} geo={box(x1 - x0, y1 - y0, 0.2)} mat={flat(BRICK)} p={[(x0 + x1) / 2, (y0 + y1) / 2, -0.1]} />
      ))}
      {courses.map((y, i) => (
        <React.Fragment key={i}>
          {[-2.6, -1.6, 2.9].map((x, j) => (
            <M key={j} geo={box(0.42, 0.14, 0.03)} mat={flat(BRICK2)} p={[x + (i % 2) * 0.25, y, 0.005]} shadow={false} />
          ))}
        </React.Fragment>
      ))}
      {/* side + back walls, interior */}
      <M geo={box(0.2, H, 4)} mat={flat(BRICK)} p={[-W / 2 + 0.1, H / 2, -2.1]} />
      <M geo={box(0.2, H, 4)} mat={flat(BRICK)} p={[W / 2 - 0.1, H / 2, -2.1]} />
      <M geo={box(W, H, 0.2)} mat={flat('#C9B48F')} p={[0, H / 2, -4.0]} />
      <M geo={box(W - 0.4, 0.05, 3.8)} mat={flat('#8C6A4E')} p={[0, 0.03, -2.1]} />
      <M geo={box(W - 0.4, H, 0.05)} mat={flat('#D9C7A2')} p={[0, H / 2, -3.88]} />
      {/* interior ceiling so the room reads dark/lit */}
      <M geo={box(W, 0.1, 4.2)} mat={flat('#CDBB98')} p={[0, H, -2.1]} />
      {/* roof */}
      <group position={[0, H, -2.0]}>
        <M geo={box(W + 0.6, 0.18, 3.0)} mat={flat('#6E5A55')} p={[0, 0.85, 1.0]} r={[0.705, 0, 0]} />
        <M geo={box(W + 0.6, 0.18, 3.0)} mat={flat('#6E5A55')} p={[0, 0.85, -1.0]} r={[-0.705, 0, 0]} />
        <M geo={GABLE} mat={flat(BRICK)} p={[-W / 2, 0, 0]} />
      </group>
      <M geo={box(0.5, 1.2, 0.5)} mat={flat(BRICK2)} p={[2.0, H + 1.1, -2.6]} />
      {/* door frame */}
      <M geo={box(0.12, 2.2, 0.26)} mat={flat(TRIM)} p={[-0.56, 1.1, -0.05]} />
      <M geo={box(0.12, 2.2, 0.26)} mat={flat(TRIM)} p={[0.56, 1.1, -0.05]} />
      <M geo={box(1.24, 0.14, 0.26)} mat={flat(TRIM)} p={[0, 2.17, -0.05]} />
      {/* window frame + sill + mullion */}
      <M geo={box(1.36, 0.1, 0.26)} mat={flat(TRIM)} p={[1.9, 2.12, -0.05]} />
      <M geo={box(1.5, 0.1, 0.36)} mat={flat(TRIM)} p={[1.9, 0.97, 0]} />
      <M geo={box(0.08, 1.15, 0.26)} mat={flat(TRIM)} p={[1.26, 1.55, -0.05]} />
      <M geo={box(0.08, 1.15, 0.26)} mat={flat(TRIM)} p={[2.54, 1.55, -0.05]} />
      {/* door */}
      {!s.doorGone && (
        flyT > 0 ? (
          <group position={[0 + flyT * 0.2, 1.05 + Math.sin(flyT * Math.PI) * 0.6 - flyT * 1.0, -0.06 - flyT * 2.6]} rotation={[-flyT * 1.5, flyT * 0.6, flyT * 0.4]}>
            <Door planks={false} />
          </group>
        ) : (
          <group position={[-0.5, 0, -0.06]} rotation={[0, -s.doorAngle, 0]}>
            <group position={[0.5, 1.05, 0]}><Door planks={s.planks} /></group>
          </group>
        )
      )}
      {/* interior light */}
      <pointLight position={[1.4, 2.6, -1.6]} intensity={6 * s.lightsOn} distance={6} color="#FFD9A0" />
      <M geo={ico(0.12, 0)} mat={flat(s.lightsOn > 0.5 ? '#FFF2C4' : '#6E6A60', {emissive: '#FFE9A8', ei: s.lightsOn * 1.4})} p={[1.4, 3.2, -1.6]} shadow={false} />
      {/* sofa */}
      <group position={[1.9, 0, -2.4]}>
        <M geo={box(1.9, 0.45, 0.8)} mat={flat('#8E6F86')} p={[0, 0.3, 0]} />
        <M geo={box(1.9, 0.7, 0.25)} mat={flat('#7D5F75')} p={[0, 0.75, -0.3]} />
        <M geo={box(0.22, 0.6, 0.8)} mat={flat('#7D5F75')} p={[0.95, 0.45, 0]} />
        <M geo={box(0.22, 0.6, 0.8)} mat={flat('#7D5F75')} p={[-0.95, 0.45, 0]} />
      </group>
      {/* tv glow on the side wall to explain the headphones/zoning out */}
      <M geo={box(0.06, 0.6, 1.0)} mat={flat('#222', {emissive: '#7FD4FF', ei: 0.6 * s.lightsOn})} p={[-2.9, 1.4, -2.2]} shadow={false} />
    </group>
  );
};

const Door: React.FC<{planks: boolean}> = ({planks}) => (
  <group>
    <M geo={box(1.0, 2.1, 0.08)} mat={flat('#2E8B7A')} />
    <M geo={box(0.7, 0.6, 0.02)} mat={flat('#257264')} p={[0, 0.45, 0.05]} />
    <M geo={box(0.7, 0.6, 0.02)} mat={flat('#257264')} p={[0, -0.35, 0.05]} />
    <M geo={ico(0.05, 0)} mat={flat('#E8C34A', {metal: 0.3})} p={[0.38, -0.05, 0.07]} />
    {planks && (
      <>
        <M geo={box(1.15, 0.14, 0.04)} mat={flat('#C9A46E')} p={[0, 0.3, 0.09]} r={[0, 0, 0.6]} />
        <M geo={box(1.15, 0.14, 0.04)} mat={flat('#C9A46E')} p={[0, 0.3, 0.1]} r={[0, 0, -0.6]} />
      </>
    )}
  </group>
);

// ---------- hanging bell (stage 1 invention) ----------
export const BELL_X = -1.1;
export type HangBellState = {show: number; popAt: number; flashBell: number; rope: number; ropePopAt: number; flashRope: number;
  swing: number; snapped: boolean; fall: number; ropeRed: number};

const bellGeo = new THREE.SphereGeometry(0.22, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const boardBellGeo = new THREE.SphereGeometry(0.13, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2);

export const HangingBell: React.FC<{s: HangBellState; f: number}> = ({s, f}) => {
  if (!s.show) return null;
  const sc = pop(f, s.popAt);
  const brass = flashMat('#D9A93B', s.flashBell);
  const fallY = -s.fall * 0.51, fallZ = s.fall * 0.43;
  return (
    <group position={[BELL_X, 0, 0]}>
      {/* bracket */}
      <group scale={sc}>
        <M geo={box(0.1, 0.1, 0.55)} mat={flat('#3A3A40')} p={[0, 2.78, 0.27]} />
        <M geo={box(0.14, 0.3, 0.04)} mat={flat('#3A3A40')} p={[0, 2.72, 0.02]} />
      </group>
      {/* bell (swings, then falls) */}
      <group position={[0, 2.74 + fallY, 0.5 + fallZ]} rotation={[s.swing + Math.sin(s.fall * Math.PI) * 0.7, 0, 0]} scale={sc}>
        <M geo={bellGeo} mat={brass} p={[0, -0.28, 0]} s={[1, 1.15, 1]} />
        <M geo={torus(0.22, 0.025, 4, 10)} mat={brass} p={[0, -0.28, 0]} r={[Math.PI / 2, 0, 0]} />
        <M geo={cyl(0.02, 0.02, 0.06, 5)} mat={flat('#3A3A40')} p={[0, 0.0, 0]} />
        <M geo={ico(0.05, 0)} mat={flat('#8A6A20')} p={[0, -0.33, 0]} />
        {/* rope (attached to clapper) */}
        {s.rope > 0 && (
          <group scale={pop(f, s.ropePopAt)}>
            <M geo={cyl(0.022, 0.022, s.snapped ? 0.35 : 1.0, 5)} mat={flashMat('#C9A46E', Math.max(s.flashRope, 0), s.ropeRed > 0 ? RED : GREEN)}
              p={[0, s.snapped ? -0.52 : -0.83, 0]} />
            {!s.snapped && <M geo={ico(0.05, 0)} mat={flat('#C9A46E')} p={[0, -1.35, 0]} />}
          </group>
        )}
      </group>
      {/* snapped lower half of rope falling */}
      {s.snapped && s.fall < 1 && (
        <M geo={cyl(0.022, 0.022, 0.8, 5)} mat={flashMat('#C9A46E', s.ropeRed, RED)} p={[0.05, 1.5 - s.fall * 1.4, 0.55]} r={[0, 0, s.fall * 1.2]} />
      )}
    </group>
  );
};

// ---------- electric bell board (stage 2 invention) ----------
export const BOARD: [number, number, number] = [BELL_X, 2.25, 0.02];
export type BoardState = {
  show: boolean;
  buttonAt: number; batteryAt: number; wire1: number; coil: number; nailAt: number; hammerAt: number; contactAt: number;
  flashButton: number; flashBattery: number; flashCoil: number; flashNail: number; flashHammer: number; flashContact: number;
  xray: number; theta: number; current: number; field: number; spark: number; pressed: number; ring: number; wire34: number;
};

type P2 = [number, number];
const Wire: React.FC<{pts: P2[]; amount?: number; mat: THREE.Material}> = ({pts, amount = 1, mat}) => {
  const segs: JSX.Element[] = [];
  let total = 0;
  const lens = pts.slice(1).map((q, i) => { const l = Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); total += l; return l; });
  let left = total * amount;
  for (let i = 0; i < lens.length && left > 0.0001; i++) {
    const a = pts[i], b = pts[i + 1], L = Math.min(lens[i], left), k = L / lens[i];
    const ex = a[0] + (b[0] - a[0]) * k, ey = a[1] + (b[1] - a[1]) * k;
    const ang = Math.atan2(ey - a[1], ex - a[0]);
    segs.push(<M key={i} geo={box(1, 0.016, 0.016)} mat={mat} p={[(a[0] + ex) / 2, (a[1] + ey) / 2, 0.035]} r={[0, 0, ang]} s={[L + 0.016, 1, 1]} shadow={false} />);
    left -= L;
  }
  return <>{segs}</>;
};
/** little yellow dots travelling along a wire = current flowing */
const Current: React.FC<{pts: P2[]; f: number; on: number}> = ({pts, f, on}) => {
  if (on <= 0) return null;
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const dots: JSX.Element[] = [];
  for (let d = 0; d < total; d += 0.09) {
    let t = (d + f * 0.02) % total, i = 0;
    while (i < lens.length - 1 && t > lens[i]) { t -= lens[i]; i++; }
    const a = pts[i], b = pts[i + 1], k = t / lens[i];
    dots.push(<M key={d} geo={box(0.024, 0.024, 0.024)} mat={flat('#FFE74A', {emissive: '#FFE74A', ei: 2})} p={[a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, 0.05]} shadow={false} />);
  }
  return <>{dots}</>;
};

export const W1: P2[] = [[0.38, -1.0], [0.38, -0.33], [0.08, -0.33]];
export const W2: P2[] = [[-0.18, -0.33], [-0.23, -0.33], [-0.23, 0], [-0.17, 0]];
export const W3: P2[] = [[0.05, -0.05], [0.08, -0.2], [0.15, -0.2]];
export const W4: P2[] = [[0.25, -0.08], [0.32, -0.08], [0.32, -1.0]];

export const BellBoard: React.FC<{s: BoardState; f: number}> = ({s, f}) => {
  if (!s.show) return null;
  const copper = flat('#D9822B', {metal: 0.2});
  const copperHot = (k: number) => flashMat('#D9822B', k);
  const coilAlpha = 1 - s.xray * 0.7;
  const nTurns = 9;
  return (
    <group position={BOARD}>
      {/* backboard */}
      <M geo={box(0.6, 0.98, 0.04)} mat={flat('#C9A46E')} p={[0, 0, 0]} />
      <M geo={box(0.62, 0.04, 0.05)} mat={flat('#9C7A48')} p={[0, 0.49, 0]} />
      <M geo={box(0.62, 0.04, 0.05)} mat={flat('#9C7A48')} p={[0, -0.49, 0]} />
      <group position={[0, 0, 0.02]}>
        {/* the brass bell (rescued from the earlier fall) */}
        <group position={[-0.06, 0.3, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <M geo={boardBellGeo} mat={flat('#D9A93B', {metal: 0.3, emissive: '#FFE08A', ei: s.ring * 0.5})} s={[1, 0.7, 1]} />
          <M geo={cyl(0.015, 0.015, 0.06, 5)} mat={flat('#555')} p={[0, -0.02, 0]} />
        </group>
        {/* battery (horizontal D-cell) */}
        {s.batteryAt < 1e8 && (
          <group position={[-0.05, -0.33, 0.06]} scale={pop(f, s.batteryAt)}>
            <M geo={cyl(0.055, 0.055, 0.2, 7)} mat={flashMat('#F28C28', s.flashBattery)} r={[0, 0, Math.PI / 2]} />
            <M geo={cyl(0.056, 0.056, 0.06, 7)} mat={flashMat('#1E1E22', s.flashBattery)} p={[0.1, 0, 0]} r={[0, 0, Math.PI / 2]} />
            <M geo={cyl(0.02, 0.02, 0.03, 6)} mat={flat('#C0C0C0', {metal: 0.6})} p={[-0.13, 0, 0]} r={[0, 0, Math.PI / 2]} />
            <M geo={box(0.03, 0.03, 0.005)} mat={flat('#fff')} p={[-0.07, 0.0, 0.056]} shadow={false} />
            <M geo={box(0.01, 0.03, 0.005)} mat={flat('#fff')} p={[-0.07, 0.0, 0.057]} shadow={false} />
          </group>
        )}
        {/* wires */}
        <Wire pts={W1} amount={s.wire1} mat={copperHot(s.flashBattery)} />
        {s.coil > 0 && <Wire pts={W2} amount={Math.min(1, s.coil * 1.5)} mat={copper} />}
        {s.wire34 > 0 && <Wire pts={W3} mat={copper} />}
        {s.contactAt < 1e8 && f >= s.contactAt && <Wire pts={W4} mat={copper} />}
        <Current pts={W1} f={f} on={s.current} />
        <Current pts={W2} f={f} on={s.current} />
        {s.wire34 > 0 && <Current pts={W3} f={f} on={s.current} />}
        {s.contactAt < 1e8 && f >= s.contactAt && <Current pts={W4} f={f} on={s.current} />}
        {/* electromagnet: coil turns + iron nail */}
        <group position={[-0.06, 0, 0.07]}>
          {Array.from({length: nTurns}).map((_, i) => {
            const show = s.coil * nTurns > i;
            if (!show) return null;
            return <M key={i} geo={torus(0.055, 0.012, 4, 8)} mat={flashMat('#D9822B', s.flashCoil, GREEN, coilAlpha)} p={[-0.1 + i * 0.025, 0, 0]} r={[0, Math.PI / 2, 0]} shadow={false} />;
          })}
          {s.nailAt < 1e8 && f >= s.nailAt && (
            <group position={[-Math.max(0, 1 - (f - s.nailAt) / 6) * 0.4, 0, 0]}>
              <M geo={cyl(0.018, 0.018, 0.3, 6)} mat={flashMat('#8A8F99', Math.max(s.flashNail, s.field * 0.6), GREEN)} p={[-0.0, 0, 0]} r={[0, 0, Math.PI / 2]} />
              <M geo={cyl(0.04, 0.04, 0.015, 6)} mat={flat('#8A8F99')} p={[-0.155, 0, 0]} r={[0, 0, Math.PI / 2]} />
              <M geo={cone(0.018, 0.04, 6)} mat={flat('#8A8F99')} p={[0.17, 0, 0]} r={[0, 0, -Math.PI / 2]} />
            </group>
          )}
          {/* magnetic field metaphor: blue loops */}
          {s.field > 0 && [0.11, 0.16, 0.21].map((r, i) => (
            <M key={i} geo={torus(r, 0.007, 3, 14)} mat={flat('#4FC3FF', {emissive: '#4FC3FF', ei: 1.5, opacity: s.field * (0.85 - i * 0.2)})} p={[0, 0, 0.0]}
              s={[1 + ((f * 0.05 + i * 0.33) % 1) * 0.15, 0.55, 1]} shadow={false} />
          ))}
        </group>
        {/* armature + hammer */}
        {s.hammerAt < 1e8 && f >= s.hammerAt - 1 && (
          <group position={[0.15, -0.2, 0.07]} rotation={[0, 0, s.theta]} scale={pop(f, s.hammerAt)}>
            <M geo={box(0.025, 0.5, 0.02)} mat={flashMat('#5C6270', s.flashHammer)} p={[0, 0.25, 0]} />
            <M geo={box(0.05, 0.08, 0.03)} mat={flashMat('#5C6270', s.flashHammer)} p={[-0.01, 0.2, 0]} />
            <M geo={ico(0.04, 0)} mat={flashMat('#3E4350', s.flashHammer)} p={[0, 0.5, 0]} />
            <M geo={box(0.06, 0.04, 0.04)} mat={flat('#333')} p={[0, 0, 0]} />
          </group>
        )}
        {/* spring contact */}
        {s.contactAt < 1e8 && f >= s.contactAt - 1 && (
          <group position={[0.25, -0.08, 0.07]} scale={pop(f, s.contactAt)}>
            <M geo={box(0.05, 0.08, 0.05)} mat={flashMat('#7A7F8C', s.flashContact)} />
            {Array.from({length: 4}).map((_, i) => (
              <M key={i} geo={box(0.022, 0.006, 0.02)} mat={flashMat('#C0C4CC', s.flashContact)} p={[-0.04 - i * 0.012, 0.012 * (i % 2 ? 1 : -1), 0]} r={[0, 0, i % 2 ? 0.8 : -0.8]} shadow={false} />
            ))}
            <M geo={ico(0.012, 0)} mat={flat('#E8C34A')} p={[-0.085, 0, 0]} />
          </group>
        )}
        {s.spark > 0 && (
          <M geo={ico(0.03, 0)} mat={flat(RED, {emissive: RED, ei: 2})} p={[0.17, -0.08, 0.1]} s={0.6 + s.spark} shadow={false} />
        )}
        {/* sound waves */}
        {s.ring > 0 && [0, 1, 2].map((i) => {
          const k = ((f * 0.12 + i / 3) % 1);
          return <M key={i} geo={torus(0.15 + k * 0.35, 0.008, 3, 16)} mat={flat('#FFFFFF', {emissive: '#FFFFFF', ei: 1, opacity: (1 - k) * s.ring})} p={[-0.06, 0.3, 0.1]} shadow={false} />;
        })}
      </group>
      {/* push button on the door frame */}
      {s.buttonAt < 1e8 && (
        <group position={[0.35, -1.0, 0.0]} scale={pop(f, s.buttonAt)}>
          <M geo={box(0.14, 0.2, 0.05)} mat={flashMat('#EFEBE2', s.flashButton)} />
          <M geo={cyl(0.04, 0.045, 0.05, 8)} mat={flashMat('#FF3B30', s.flashButton)} p={[0, 0, 0.04 - s.pressed * 0.025]} r={[Math.PI / 2, 0, 0]} />
        </group>
      )}
    </group>
  );
};

/** Expanding white rings for sound (knocks / dings), in world space. */
export const SoundRings: React.FC<{at: [number, number, number]; f: number; start: number; len?: number; size?: number; color?: string}> = ({at, f, start, len = 14, size = 0.6, color = '#FFFFFF'}) => {
  const t = (f - start) / len;
  if (t < 0 || t > 1) return null;
  return (
    <>
      {[0, 0.3].map((o, i) => {
        const k = t - o; if (k < 0) return null;
        return <M key={i} geo={torus(0.1 + k * size, 0.012, 3, 14)} mat={flat(color, {emissive: color, ei: 1.2, opacity: 1 - k})} p={at} shadow={false} />;
      })}
    </>
  );
};

/** Taser bolts: jagged emissive yellow segments between two points, re-randomised every 2 frames. */
export const Bolt: React.FC<{a: [number, number, number]; b: [number, number, number]; f: number}> = ({a, b, f}) => {
  const segs: JSX.Element[] = [];
  const n = 7; let prev = a;
  const seed = Math.floor(f / 2);
  const rnd = (i: number) => { const x = Math.sin(seed * 91.7 + i * 47.3) * 43758.5; return x - Math.floor(x) - 0.5; };
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const q: [number, number, number] = i === n ? b : [a[0] + (b[0] - a[0]) * t + rnd(i) * 0.25, a[1] + (b[1] - a[1]) * t + rnd(i + 9) * 0.25, a[2] + (b[2] - a[2]) * t + rnd(i + 19) * 0.25];
    const v = new THREE.Vector3(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]);
    const L = v.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(quat);
    segs.push(<M key={i} geo={box(0.035, 1, 0.035)} mat={flat('#FFE74A', {emissive: '#FFE74A', ei: 3})} p={[(q[0] + prev[0]) / 2, (q[1] + prev[1]) / 2, (q[2] + prev[2]) / 2]} r={[e.x, e.y, e.z]} s={[1, L, 1]} shadow={false} />);
    prev = q;
  }
  return <>{segs}</>;
};

/** Low-poly wind ribbons blowing from `from` along +dir. */
export const Wind: React.FC<{from: [number, number, number]; dir: [number, number, number]; f: number; start: number; len: number}> = ({from, dir, f, start, len}) => {
  const t = (f - start) / len;
  if (t < 0 || t > 1) return null;
  const items: JSX.Element[] = [];
  for (let r = 0; r < 6; r++) {
    const k = (t * 1.6 + r * 0.13) % 1.0;
    const off = [(r % 3 - 1) * 0.22, (Math.floor(r / 3) - 0.5) * 0.25];
    const d = k * 2.6;
    const yaw = Math.atan2(dir[0], dir[2]);
    for (let s = 0; s < 3; s++) {
      const ds = d - s * 0.18; if (ds < 0) continue;
      items.push(
        <M key={`${r}-${s}`} geo={box(0.04, 0.04, 0.22)} mat={flat('#FFFFFF', {emissive: '#FFFFFF', ei: 0.8, opacity: (1 - k) * 0.9})}
          p={[from[0] + dir[0] * ds + off[0], from[1] + dir[1] * ds + off[1] + Math.sin(ds * 6 + r) * 0.06, from[2] + dir[2] * ds + off[0] * 0.3]}
          r={[0, yaw, Math.sin(ds * 6 + r) * 0.4]} shadow={false} />,
      );
    }
  }
  return <>{items}</>;
};

export {GREEN, RED};
