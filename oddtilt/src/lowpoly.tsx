// Shared low-poly helpers: flat-shaded materials, emissive flash, pop-in, x-ray.
import React from 'react';
import * as THREE from 'three';

export const GREEN = '#38E54D';
export const RED = '#FF3B30';

const cache = new Map<string, THREE.MeshStandardMaterial>();
/** Flat-shaded matte material (cached per colour so 900 frames don't leak materials). */
export const flat = (color: string, opts: {emissive?: string; ei?: number; opacity?: number; metal?: number} = {}) => {
  const key = `${color}|${opts.emissive ?? ''}|${(opts.ei ?? 0).toFixed(2)}|${(opts.opacity ?? 1).toFixed(2)}|${opts.metal ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.85, metalness: opts.metal ?? 0,
      emissive: opts.emissive ?? '#000000', emissiveIntensity: opts.ei ?? 0,
      transparent: (opts.opacity ?? 1) < 1, opacity: opts.opacity ?? 1, depthWrite: (opts.opacity ?? 1) >= 1,
    });
    cache.set(key, m);
  }
  return m;
};

/** Emissive flash envelope: 0→1 instantly at `at`, holds, fades out over `len` frames (8–12 per style bible). */
export const flashK = (f: number, at: number, len = 10) => (f < at || f > at + len ? 0 : 1 - (f - at) / len);

/** 5-frame pop-in: 0 → 1.08 (F3) → 1.0 (F5). */
export const pop = (f: number, at: number) => {
  const t = f - at;
  if (t <= 0) return 0.0001;
  if (t >= 5) return 1;
  if (t <= 3) return (t / 3) * 1.08;
  return 1.08 - ((t - 3) / 2) * 0.08;
};

/** Material that flashes green/red over its base colour. */
export const flashMat = (base: string, k: number, tint = GREEN, opacity = 1) =>
  flat(k > 0 ? lerpHex(base, tint, Math.min(1, k * 1.2)) : base, {emissive: tint, ei: k * 1.6, opacity});

export const lerpHex = (a: string, b: string, t: number) => {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, Math.round(t * 10) / 10).getHexString();
};

export const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3); // ease-out cubic
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** 0..1 progress of frame f through [a, a+len], eased. */
export const prog = (f: number, a: number, len: number) => ease((f - a) / len);

type MP = {geo: THREE.BufferGeometry; mat: THREE.Material; p?: [number, number, number]; r?: [number, number, number]; s?: number | [number, number, number]; shadow?: boolean};
export const M: React.FC<MP> = ({geo, mat, p, r, s, shadow = true}) => (
  <mesh geometry={geo} material={mat} position={p} rotation={r} scale={s as any} castShadow={shadow} receiveShadow />
);

// geometry cache
const gcache = new Map<string, THREE.BufferGeometry>();
const g = (key: string, make: () => THREE.BufferGeometry) => {
  let x = gcache.get(key);
  if (!x) { x = make(); gcache.set(key, x); }
  return x;
};
export const box = (w: number, h: number, d: number) => g(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const cyl = (rt: number, rb: number, h: number, seg = 6) => g(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
export const cone = (r: number, h: number, seg = 5) => g(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const ico = (r: number, d = 0) => g(`i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));
export const torus = (r: number, t: number, rs = 4, ts = 8, arc = Math.PI * 2) => g(`t${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
export const dodec = (r: number) => g(`d${r}`, () => new THREE.DodecahedronGeometry(r, 0));
