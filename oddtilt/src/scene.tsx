// Camera + light rig shared by every composition.
import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

export type V3 = [number, number, number];
export const CamRig: React.FC<{pos: V3; look: V3; fov?: number}> = ({pos, look, fov = 35}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};

export const Lights: React.FC<{at?: V3; sky?: string; mood?: number}> = ({at = [0, 0, 0], sky = '#BFD3E6', mood = 1}) => {
  const target = React.useMemo(() => new THREE.Object3D(), []);
  target.position.set(at[0], 0, at[2]);
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={[sky, '#8C8A7E', 1.25 * mood]} />
      <ambientLight intensity={0.35 * mood} />
      <directionalLight position={[at[0] + 5, 9, at[2] + 6]} target={target} intensity={2.3 * mood} color="#FFF1DC" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0006} />
    </>
  );
};
