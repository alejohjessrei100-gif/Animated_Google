// Low-poly pig (the homeowner / the cop). Saturated pink hero colours.
import React from 'react';
import {M, flat, box, cyl, cone, ico} from './lowpoly';

const P = {skin: '#F59AB0', dark: '#E0738F', snout: '#F7B8C6', hoof: '#5A3A3A'};

export type PigPose = {
  sit?: boolean; armR?: number; armL?: number; headTurn?: number; headNod?: number; bob?: number;
  headphones?: boolean; cop?: boolean; taser?: boolean; mouth?: number; shirt?: string;
};

export const Pig: React.FC<{pose?: PigPose; position?: [number, number, number]; rotation?: number; scale?: number}> = ({
  pose = {}, position = [0, 0, 0], rotation = 0, scale = 1,
}) => {
  const p = {sit: false, armR: 0.1, armL: 0.1, headTurn: 0, headNod: 0, bob: 0, mouth: 0, shirt: '#3FA7D6', ...pose};
  const hipY = p.sit ? 0.55 : 0.62;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* legs */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.16, hipY, 0]} rotation={[p.sit ? -1.45 : 0, 0, 0]}>
          <M geo={cyl(0.11, 0.1, 0.5, 6)} mat={flat(p.cop ? '#1E2A4A' : P.skin)} p={[0, -0.25, 0]} />
          <M geo={cyl(0.1, 0.1, 0.1, 6)} mat={flat(P.hoof)} p={[0, -0.52, 0]} />
        </group>
      ))}
      {/* body */}
      <group position={[0, hipY + p.bob, 0]}>
        <M geo={ico(0.42, 0)} mat={flat(p.cop ? '#2B3F73' : p.shirt)} p={[0, 0.38, 0]} s={[1, 1.05, 0.9]} />
        {p.cop && <M geo={box(0.1, 0.12, 0.03)} mat={flat('#F2C230', {metal: 0.4})} p={[0.17, 0.52, 0.36]} />}
        {/* arms */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.4, 0.55, 0]} rotation={[-(s > 0 ? p.armL : p.armR), 0, s * 0.35]}>
            <M geo={cyl(0.08, 0.075, 0.42, 6)} mat={flat(p.cop ? '#2B3F73' : p.shirt)} p={[0, -0.2, 0]} />
            <M geo={ico(0.08, 0)} mat={flat(P.skin)} p={[0, -0.44, 0]} />
            {s < 0 && p.taser && (
              <group position={[0, -0.5, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <M geo={box(0.09, 0.22, 0.12)} mat={flat('#FFD60A')} p={[0, 0.06, 0]} />
                <M geo={box(0.05, 0.05, 0.05)} mat={flat('#222')} p={[0, 0.19, 0]} />
              </group>
            )}
          </group>
        ))}
        {/* head */}
        <group position={[0, 0.98, 0.02]} rotation={[p.headNod, p.headTurn, 0]}>
          <M geo={ico(0.33, 0)} mat={flat(P.skin)} s={[1.08, 0.95, 1]} />
          <M geo={cyl(0.13, 0.15, 0.14, 7)} mat={flat(P.snout)} p={[0, -0.04, 0.33]} r={[Math.PI / 2, 0, 0]} />
          <M geo={box(0.03, 0.06, 0.02)} mat={flat(P.dark)} p={[0.05, -0.04, 0.41]} />
          <M geo={box(0.03, 0.06, 0.02)} mat={flat(P.dark)} p={[-0.05, -0.04, 0.41]} />
          {p.mouth > 0 && <M geo={box(0.14, 0.05 * p.mouth + 0.01, 0.03)} mat={flat('#7A2236')} p={[0, -0.2, 0.28]} />}
          {[1, -1].map((s) => (
            <React.Fragment key={s}>
              <M geo={box(0.06, 0.08, 0.03)} mat={flat('#141414')} p={[s * 0.13, 0.1, 0.29]} shadow={false} />
              <M geo={box(0.02, 0.02, 0.01)} mat={flat('#FFFFFF')} p={[s * 0.13 + 0.015, 0.12, 0.307]} shadow={false} />
              <M geo={cone(0.12, 0.22, 4)} mat={flat(P.dark)} p={[s * 0.22, 0.28, 0]} r={[0.4, 0, s * -0.6]} />
            </React.Fragment>
          ))}
          {p.headphones && (
            <>
              <M geo={box(0.78, 0.06, 0.1)} mat={flat('#222')} p={[0, 0.33, 0]} />
              <M geo={box(0.06, 0.3, 0.08)} mat={flat('#222')} p={[0.38, 0.17, 0]} />
              <M geo={box(0.06, 0.3, 0.08)} mat={flat('#222')} p={[-0.38, 0.17, 0]} />
              <M geo={cyl(0.13, 0.13, 0.12, 6)} mat={flat('#FF3B30')} p={[0.39, 0, 0]} r={[0, 0, Math.PI / 2]} />
              <M geo={cyl(0.13, 0.13, 0.12, 6)} mat={flat('#FF3B30')} p={[-0.39, 0, 0]} r={[0, 0, Math.PI / 2]} />
            </>
          )}
          {p.cop && (
            <group position={[0, 0.3, 0]}>
              <M geo={cyl(0.27, 0.24, 0.16, 8)} mat={flat('#1E2A4A')} p={[0, 0.06, 0]} />
              <M geo={cyl(0.3, 0.3, 0.03, 8)} mat={flat('#111')} p={[0, -0.03, 0.08]} />
              <M geo={box(0.08, 0.08, 0.03)} mat={flat('#F2C230', {metal: 0.4})} p={[0, 0.07, 0.25]} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
};
