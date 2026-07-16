import type { FretPos, StringNo } from "@/theory/fretboard";

// 표준 튜닝 개방현 MIDI: E2 A2 D3 G3 B3 E4
const OPEN_MIDI: Record<StringNo, number> = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };

export function midiAt(pos: FretPos): number {
  return OPEN_MIDI[pos.str] + pos.fret;
}

export function freqOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const PREF_KEY = "fretboard-sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true; // 저장소 접근 불가 시 기본값(켬)으로 동작
  }
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    // 저장 실패는 무해 — 이번 세션 동안만 기본값으로 동작
  }
}

interface GainLike {
  gain: {
    setValueAtTime(value: number, time: number): unknown;
    exponentialRampToValueAtTime(value: number, time: number): unknown;
  };
  connect(dest: unknown): unknown;
}

interface OscillatorLike {
  type: string;
  frequency: { value: number };
  connect(node: unknown): unknown;
  start(time: number): void;
  stop(time: number): void;
}

export interface AudioContextLike {
  currentTime: number;
  destination: unknown;
  state?: string;
  resume?(): unknown;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
}

let sharedCtx: AudioContextLike | null = null;

function getContext(): AudioContextLike | null {
  if (sharedCtx) return sharedCtx;
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext;
  if (!AC) return null;
  sharedCtx = new AC();
  return sharedCtx;
}

export function playPosition(pos: FretPos, ctxOverride?: AudioContextLike): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = ctxOverride ?? getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume?.();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freqOf(midiAt(pos));
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1);
  } catch {
    // 오디오 실패는 학습 흐름에 무해 — 조용히 무시
  }
}
