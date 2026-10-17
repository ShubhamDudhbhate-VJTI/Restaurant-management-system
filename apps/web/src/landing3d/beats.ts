import type { Color } from 'three';

export type BeatKey = 'arrive' | 'scan' | 'order' | 'kitchen' | 'bill' | 'roles' | 'close';

export type Beat = {
  key: BeatKey;
  start: number;
  end: number;
  camera: [number, number, number];
  target: [number, number, number];
  tableRotation: number;
  tableScale: number;
  menuSpread: number;
  ticketProgress: number;
  receiptProgress: number;
  chairProgress: number;
  accent: string;
  background: string;
};

export const beats: Beat[] = [
  { key: 'arrive', start: 0, end: 0.12, camera: [0, 8.5, 0.2], target: [0, 0, 0], tableRotation: 0, tableScale: 1, menuSpread: 0, ticketProgress: 0, receiptProgress: 0, chairProgress: 0, accent: '#F5A623', background: '#1B3FBF' },
  { key: 'scan', start: 0.12, end: 0.3, camera: [5.8, 6.6, 5.8], target: [0, 0, 0], tableRotation: 0.18, tableScale: 1.04, menuSpread: 1, ticketProgress: 0, receiptProgress: 0, chairProgress: 0, accent: '#F5A623', background: '#1B3FBF' },
  { key: 'order', start: 0.3, end: 0.5, camera: [6.8, 4.9, 6.8], target: [0, 0.2, 0], tableRotation: 0.45, tableScale: 1.02, menuSpread: 2, ticketProgress: 0.35, receiptProgress: 0, chairProgress: 0, accent: '#F5A623', background: '#1B3FBF' },
  { key: 'kitchen', start: 0.5, end: 0.7, camera: [8, 3.7, 2.9], target: [0, 0.5, 0], tableRotation: 0.8, tableScale: 0.92, menuSpread: 1.2, ticketProgress: 1, receiptProgress: 0, chairProgress: 0, accent: '#8E98A4', background: '#12141A' },
  { key: 'bill', start: 0.7, end: 0.85, camera: [4.8, 6.6, 5.8], target: [0, 0, 0], tableRotation: 1.2, tableScale: 1, menuSpread: 0.25, ticketProgress: 0.4, receiptProgress: 1, chairProgress: 0, accent: '#E23B2E', background: '#EEF0F2' },
  { key: 'roles', start: 0.85, end: 0.95, camera: [-6.2, 5.4, 5.4], target: [0, 0, 0], tableRotation: 1.7, tableScale: 1.04, menuSpread: 0, ticketProgress: 0, receiptProgress: 0.7, chairProgress: 1, accent: '#F5A623', background: '#1B3FBF' },
  { key: 'close', start: 0.95, end: 1, camera: [0, 9.6, 0], target: [0, 0, 0], tableRotation: Math.PI * 2, tableScale: 0.92, menuSpread: 0, ticketProgress: 0, receiptProgress: 0, chairProgress: 1, accent: '#F5A623', background: '#1B3FBF' },
];

export function sampleBeat(progress: number) {
  const value = Math.max(0, Math.min(1, progress));
  const index = Math.min(beats.length - 2, beats.findIndex((beat) => value <= beat.end));
  const current = beats[Math.max(index, 0)];
  const next = beats[Math.min(Math.max(index, 0) + 1, beats.length - 1)];
  const span = Math.max(next.start - current.start, 0.001);
  const local = Math.max(0, Math.min(1, (value - current.start) / span));
  return { current, next, local };
}

export function mixNumber(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function mixVector(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [mixNumber(a[0], b[0], t), mixNumber(a[1], b[1], t), mixNumber(a[2], b[2], t)];
}

export function mixColor(a: string, b: string, t: number, target: Color, scratch: Color) {
  target.set(a).lerp(scratch.set(b), t);
}
