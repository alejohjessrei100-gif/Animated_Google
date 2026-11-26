import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CamRig, Lights} from './scene';
import {Wolf, WOLF} from './wolf';
import {M, flat, cyl} from './lowpoly';

const Label: React.FC<{x: string; t: string}> = ({x, t}) => (
  <div style={{position: 'absolute', left: x, bottom: 70, transform: 'translateX(-50%)', fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 34, color: '#fff', WebkitTextStroke: '6px #000', paintOrder: 'stroke fill'}}>{t}</div>
);

export const Turnaround: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#C9D6E2'}}>
    <ThreeCanvas width={1920} height={1080} shadows camera={{fov: 30, near: 0.1, far: 100}}>
      <color attach="background" args={['#C9D6E2']} />
      <CamRig pos={[0, 2.2, 11]} look={[0, 1.15, 0]} fov={28} />
      <Lights />
      <M geo={cyl(9, 9, 0.1, 9)} mat={flat('#A9B2AA')} p={[0, -0.05, 0]} />
      <Wolf position={[-3.4, 0, 0]} rotation={0.45} pose={{briefcase: true, armL: [0.1, 0.15, 0.3], tail: 0.3}} />
      <Wolf position={[-1.1, 0, 0]} rotation={0} pose={{armL: [0.2, 1.0, 1.9], armR: [0.05, 0.12, 0.2], jaw: 0.6, brow: -0.6, headTilt: 0.1}} />
      <Wolf position={[1.2, 0, 0]} rotation={Math.PI / 2} pose={{briefcase: true}} />
      <Wolf position={[3.4, 0, 0]} rotation={Math.PI} pose={{tail: 0.4}} />
    </ThreeCanvas>
    <div style={{position: 'absolute', top: 50, width: '100%', textAlign: 'center', fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 64, color: '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill'}}>
      MAIN CHARACTER: THE WOLF IN A SUIT
    </div>
    <Label x="15%" t="3/4" /><Label x="39%" t="FRONT" /><Label x="63%" t="SIDE" /><Label x="85%" t="BACK" />
    <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: 28, color: '#1d2a3a'}}>
      fur {WOLF.fur} · suit {WOLF.suit} · tie {WOLF.tie} · eyes {WOLF.eye} · briefcase {WOLF.case}
    </div>
  </AbsoluteFill>
);
