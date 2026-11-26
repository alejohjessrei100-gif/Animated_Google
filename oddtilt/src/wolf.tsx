// "Walter" — the channel's main character: a low-poly grey wolf in a royal-blue suit,
// white shirt, red tie, black shoes, amber eyes, brown briefcase.
import React from 'react';
import {M, flat, box, cyl, cone, ico, flashMat, RED} from './lowpoly';

export const WOLF = {
  fur: '#7F8794', furDark: '#5B6270', furLight: '#E4DED2', suit: '#2457C5', suitDark: '#183C8C',
  shirt: '#F4F4F0', tie: '#E0262B', shoe: '#1A1A1E', eye: '#FFB21E', nose: '#16161A', innerEar: '#E79AA8', case: '#8B4A22',
};

/** Arm pose: [swing forward (rad), raise sideways (rad), elbow bend (rad)] */
export type Arm = [number, number, number];
export type Pose = {
  armL?: Arm; armR?: Arm;
  legL?: number; legR?: number;   // hip swing (rad, + = forward)
  kneeL?: number; kneeR?: number;
  lean?: number;                  // torso lean forward (rad)
  side?: number;                  // torso tilt sideways (rad)
  headTilt?: number; headTurn?: number; headNod?: number;
  jaw?: number;                   // 0 closed .. 1 wide open
  brow?: number;                  // -1 angry/smug .. +1 worried
  ears?: number;                  // 0 up .. 1 flat back
  eyes?: number;                  // 1 open, 0.15 squint, 0 shut
  cheeks?: number;                // 1 = puffed (huff & puff)
  tail?: number;                  // tail wag angle
  briefcase?: boolean;
  hurt?: number;                  // red flash 0..1 on head / back
  dizzy?: boolean;
  brace?: boolean;                // neck brace (after the tasing)
  bandage?: boolean;              // head bandage (after the bell)
};

const Arm_: React.FC<{side: 1 | -1; a: Arm; hold?: boolean; hurt: number}> = ({side, a, hold, hurt}) => {
  const C = WOLF;
  return (
    <group position={[side * 0.43, 1.5, 0]} rotation={[-a[0], 0, side * a[1]]}>
      <M geo={ico(0.13, 0)} mat={flat(C.suit)} p={[0, 0, 0]} />
      <M geo={cyl(0.1, 0.09, 0.4, 6)} mat={flat(C.suit)} p={[0, -0.2, 0]} />
      <group position={[0, -0.4, 0]} rotation={[-a[2], 0, 0]}>
        <M geo={ico(0.095, 0)} mat={flat(C.suit)} />
        <M geo={cyl(0.09, 0.08, 0.34, 6)} mat={flat(C.suit)} p={[0, -0.17, 0]} />
        <M geo={cyl(0.085, 0.085, 0.06, 6)} mat={flat(C.shirt)} p={[0, -0.36, 0]} />
        {/* paw */}
        <M geo={ico(0.1, 0)} mat={flat(C.fur)} p={[0, -0.45, 0.01]} s={[1, 1.1, 0.9]} />
        <M geo={cone(0.035, 0.09, 4)} mat={flat(C.furDark)} p={[0.0, -0.52, 0.06]} r={[2.6, 0, 0]} />
        {hold && (
          <group position={[0, -0.58, 0]}>
            <M geo={box(0.03, 0.03, 0.18)} mat={flat('#3A2010')} p={[0, 0, 0]} />
            <M geo={box(0.12, 0.34, 0.5)} mat={flat(C.case)} p={[0, -0.2, 0]} />
            <M geo={box(0.13, 0.03, 0.51)} mat={flat('#5C2E14')} p={[0, -0.08, 0]} />
            <M geo={box(0.135, 0.05, 0.06)} mat={flat('#E8C34A', {metal: 0.3})} p={[0, -0.08, 0.14]} />
            <M geo={box(0.135, 0.05, 0.06)} mat={flat('#E8C34A', {metal: 0.3})} p={[0, -0.08, -0.14]} />
          </group>
        )}
      </group>
      {hurt > 0 && <M geo={ico(0.02)} mat={flat(RED)} shadow={false} />}
    </group>
  );
};

const Leg: React.FC<{side: 1 | -1; swing: number; knee: number}> = ({side, swing, knee}) => {
  const C = WOLF;
  return (
    <group position={[side * 0.17, 0.86, 0]} rotation={[-swing, 0, 0]}>
      <M geo={cyl(0.13, 0.11, 0.44, 6)} mat={flat(C.suit)} p={[0, -0.22, 0]} />
      <group position={[0, -0.44, 0]} rotation={[knee, 0, 0]}>
        <M geo={cyl(0.11, 0.1, 0.36, 6)} mat={flat(C.suit)} p={[0, -0.18, 0]} />
        <M geo={box(0.2, 0.11, 0.34)} mat={flat(C.shoe)} p={[0, -0.37, 0.06]} />
        <M geo={box(0.2, 0.06, 0.1)} mat={flat('#2E2E34')} p={[0, -0.41, 0.24]} />
      </group>
    </group>
  );
};

export const Wolf: React.FC<{pose?: Pose; position?: [number, number, number]; rotation?: number; scale?: number}> = ({
  pose = {}, position = [0, 0, 0], rotation = 0, scale = 1,
}) => {
  const C = WOLF;
  const p = {armL: [0.05, 0.12, 0.15] as Arm, armR: [0.05, 0.12, 0.15] as Arm, legL: 0, legR: 0, kneeL: 0, kneeR: 0, lean: 0, side: 0,
    headTilt: 0, headTurn: 0, headNod: 0, jaw: 0, brow: 0, ears: 0, eyes: 1, cheeks: 0, tail: 0, briefcase: false, hurt: 0, brace: false, bandage: false, ...pose};
  const hurtMat = (base: string) => (p.hurt > 0 ? flashMat(base, p.hurt, RED) : flat(base));
  const eyeH = Math.max(0.012, 0.075 * p.eyes);
  const cheek = 1 + p.cheeks * 0.55;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <Leg side={1} swing={p.legL} knee={p.kneeL} />
      <Leg side={-1} swing={p.legR} knee={p.kneeR} />
      <group position={[0, 0.86, 0]} rotation={[p.lean, 0, p.side]}>
        <group position={[0, -0.86, 0]}>
          {/* hips / belt */}
          <M geo={cyl(0.31, 0.3, 0.16, 7)} mat={flat(C.suitDark)} p={[0, 0.9, 0]} />
          {/* tail */}
          <group position={[0, 0.95, -0.27]} rotation={[1.25, p.tail, 0]}>
            <M geo={cone(0.17, 0.6, 6)} mat={flat(C.fur)} p={[0, -0.28, 0]} r={[Math.PI, 0, 0]} />
            <M geo={cone(0.08, 0.2, 6)} mat={flat(C.furDark)} p={[0, -0.64, 0]} r={[Math.PI, 0, 0]} />
          </group>
          {/* jacket */}
          <M geo={cyl(0.4, 0.33, 0.68, 7)} mat={hurtMat(C.suit)} p={[0, 1.27, 0]} />
          {/* shirt V + tie */}
          <M geo={box(0.2, 0.34, 0.06)} mat={flat(C.shirt)} p={[0, 1.42, 0.355]} r={[-0.12, 0, 0]} />
          <M geo={box(0.12, 0.11, 0.06)} mat={flat(C.shirt)} p={[0, 1.31, 0.36]} r={[-0.1, 0, Math.PI / 4]} />
          <M geo={box(0.07, 0.06, 0.05)} mat={flat(C.tie)} p={[0, 1.55, 0.37]} />
          <M geo={box(0.07, 0.3, 0.04)} mat={flat(C.tie)} p={[0, 1.38, 0.385]} r={[-0.1, 0, 0]} />
          <M geo={cone(0.05, 0.07, 4)} mat={flat(C.tie)} p={[0, 1.215, 0.385]} r={[Math.PI, Math.PI / 4, 0]} />
          {/* lapels */}
          <M geo={box(0.09, 0.4, 0.05)} mat={flat(C.suitDark)} p={[0.13, 1.42, 0.35]} r={[-0.12, 0, -0.32]} />
          <M geo={box(0.09, 0.4, 0.05)} mat={flat(C.suitDark)} p={[-0.13, 1.42, 0.35]} r={[-0.12, 0, 0.32]} />
          {/* buttons + pocket square */}
          <M geo={box(0.04, 0.04, 0.03)} mat={flat('#0E1F4D')} p={[0, 1.13, 0.345]} />
          <M geo={box(0.04, 0.04, 0.03)} mat={flat('#0E1F4D')} p={[0, 1.03, 0.335]} />
          <M geo={cone(0.04, 0.07, 3)} mat={flat(C.tie)} p={[0.24, 1.45, 0.31]} />
          {/* fur chest ruff at collar */}
          <M geo={cone(0.2, 0.18, 6)} mat={flat(C.furLight)} p={[0, 1.66, 0.12]} r={[0.5, 0, 0]} />
          <Arm_ side={1} a={p.armL} hurt={0} />
          <Arm_ side={-1} a={p.armR} hold={p.briefcase} hurt={0} />
          {/* neck + head */}
          <M geo={cyl(0.13, 0.16, 0.18, 6)} mat={flat(C.fur)} p={[0, 1.66, 0]} />
          {p.brace && <M geo={cyl(0.24, 0.27, 0.24, 8)} mat={flat('#F2F2EE')} p={[0, 1.68, 0.02]} />}
          <group position={[0, 1.83, 0.02]} rotation={[p.headNod, p.headTurn, p.headTilt]}>
            <M geo={ico(0.3, 0)} mat={hurtMat(C.fur)} s={[1.05, 0.92, 1]} />
            {/* cheek tufts */}
            <M geo={cone(0.11 * cheek, 0.22, 4)} mat={flat(C.furLight)} p={[0.25, -0.08, 0.05]} r={[0, 0, -1.9]} />
            <M geo={cone(0.11 * cheek, 0.22, 4)} mat={flat(C.furLight)} p={[-0.25, -0.08, 0.05]} r={[0, 0, 1.9]} />
            {p.cheeks > 0 && [1, -1].map((s) => <M key={s} geo={ico(0.17, 0)} mat={flat(C.furLight)} p={[s * 0.17, -0.07, 0.24]} s={0.2 + p.cheeks * 0.8} />)}
            {/* snout (upper) */}
            <M geo={cyl(0.08, 0.16, 0.44, 5)} mat={flat(C.fur)} p={[0, -0.03, 0.4]} r={[Math.PI / 2, 0, 0]} s={[1, 1, 0.8]} />
            <M geo={ico(0.055, 0)} mat={flat(C.nose)} p={[0, 0.01, 0.62]} />
            {/* lower jaw (hinged) */}
            <group position={[0, -0.1, 0.2]} rotation={[p.jaw * 0.6, 0, 0]}>
              <M geo={cyl(0.055, 0.12, 0.38, 5)} mat={flat(C.furLight)} p={[0, -0.01, 0.17]} r={[Math.PI / 2, 0, 0]} s={[1, 1, 0.55]} />
              {p.jaw > 0.2 && <M geo={box(0.12, 0.02, 0.2)} mat={flat('#C2384A')} p={[0, 0.02, 0.12]} />}
            </group>
            {/* eyes */}
            {[1, -1].map((s) => (
              <group key={s} position={[s * 0.12, 0.08, 0.25]} rotation={[0, s * 0.35, 0]}>
                <M geo={box(0.1, eyeH, 0.03)} mat={flat(p.dizzy ? '#FFFFFF' : C.eye)} shadow={false} />
                <M geo={box(0.04, Math.max(0.01, eyeH * 0.9), 0.035)} mat={flat('#111')} p={[s * -0.01, 0, 0.005]} shadow={false} />
                <M geo={box(0.13, 0.03, 0.04)} mat={flat(C.furDark)} p={[0, 0.07, 0.01]} r={[0, 0, s * (0.25 - p.brow * 0.45)]} shadow={false} />
              </group>
            ))}
            {/* ears */}
            {[1, -1].map((s) => (
              <group key={s} position={[s * 0.15, 0.22, -0.04]} rotation={[-p.ears * 1.1, 0, s * -0.25]}>
                <M geo={cone(0.11, 0.3, 4)} mat={flat(C.fur)} p={[0, 0.13, 0]} />
                <M geo={cone(0.06, 0.18, 4)} mat={flat(C.innerEar)} p={[0, 0.1, 0.05]} />
              </group>
            ))}
            {p.bandage && (
              <>
                <M geo={cyl(0.3, 0.31, 0.1, 8)} mat={flat('#F7F3EA')} p={[0, 0.13, -0.01]} r={[0.18, 0, 0.12]} />
                <M geo={box(0.16, 0.05, 0.03)} mat={flat('#F2C6A0')} p={[0.1, 0.26, 0.2]} r={[0.6, 0, 0.6]} />
                <M geo={box(0.16, 0.05, 0.03)} mat={flat('#F2C6A0')} p={[0.1, 0.26, 0.2]} r={[0.6, 0, -0.6]} />
              </>
            )}
            {/* forehead fur tuft */}
            <M geo={cone(0.08, 0.16, 4)} mat={flat(C.furDark)} p={[0, 0.25, 0.1]} r={[0.6, 0, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
};

/** Simple procedural walk cycle (frames → pose). */
export const walkPose = (f: number, speed = 0.35, extra: Pose = {}): Pose => {
  const ph = f * speed;
  const s = Math.sin(ph);
  return {legL: s * 0.45, legR: -s * 0.45, kneeL: Math.max(0, -s) * 0.5, kneeR: Math.max(0, s) * 0.5,
    armL: [-s * 0.4, 0.12, 0.25], armR: [s * 0.4, 0.12, 0.25], tail: Math.sin(ph * 2) * 0.25, headNod: Math.abs(s) * 0.04, ...extra};
};
