import type { ProgNoteInfo } from "@/theory/progression";

export type LabelMode = "name" | "degree" | "none";

/** 지판의 원 하나를 그리는 데 필요한 전부. 일반·오버레이·진행 경로가 같은 형태로 떨어진다. */
export interface NoteVisual {
  fill: string;
  fillOpacity: number;
  stroke: string | null;
  strokeWidth: number;
  dashed: boolean;
  radius: number;
  /** 공통음 표시 — 원 바깥에 한 겹 더. 안쪽에 두면 2줄 라벨을 관통한다. */
  halo: string | null;
  primary: string | null;    // 라벨 윗줄
  secondary: string | null;  // 라벨 아랫줄 (공통음의 다음 코드 도수)
  labelFill: string | null;  // null = 기본 흰색(.note-label)
}

// 주의: degreeFill이 변화표(b·#)를 일괄 제거하므로 b5·#5·bb7·b9·#9·#11·b13도 해당 슬롯 색이 된다.
const TONE_FILL: Record<string, string> = {
  "1": "var(--note-root)",
  "3": "var(--tone-3)",
  "5": "var(--tone-5)",
  "7": "var(--tone-7)",
  "9": "var(--tone-9)",
  "11": "var(--tone-11)",
  "13": "var(--tone-13)",
};

export function degreeFill(degree: string): string {
  return TONE_FILL[degree.replace(/[b#]/g, "")] ?? "var(--note-scale)";
}

const GHOST_RING: Record<"half" | "other", { stroke: string; strokeWidth: number; dashed: boolean }> = {
  half: { stroke: "var(--prog-half)", strokeWidth: 2, dashed: false },
  other: { stroke: "var(--prog-other)", strokeWidth: 1.5, dashed: true },
};

const GHOST_FILL_OPACITY = 0.3;

/**
 * 진행 모드의 원 하나.
 * 면은 언제나 도수 색 — 불투명도가 "지금이냐 다음이냐"를, 링이 "얼마나 움직이나"를 말한다.
 */
export function progNoteVisual(info: ProgNoteInfo, labelMode: LabelMode): NoteVisual {
  const ghost = info.role === "half" || info.role === "other";
  const ring = ghost ? GHOST_RING[info.role as "half" | "other"] : null;
  // 고스트는 정의상 현재 코드의 루트가 될 수 없어 바깥 링이 겹치지 않는다.
  const rootRing = info.isRoot ? { stroke: "var(--note-root-ring)", strokeWidth: 3 } : null;
  const secondary =
    labelMode === "degree" && info.role === "common" ? info.nextDegree : null;

  return {
    fill: degreeFill(info.degree),
    fillOpacity: ghost ? GHOST_FILL_OPACITY : 1,
    stroke: ring?.stroke ?? rootRing?.stroke ?? null,
    strokeWidth: ring?.strokeWidth ?? rootRing?.strokeWidth ?? 0,
    dashed: ring?.dashed ?? false,
    radius: 12,
    halo: info.role === "common" ? "var(--prog-common)" : null,
    primary: labelMode === "name" ? info.name : labelMode === "degree" ? info.degree : null,
    secondary,
    labelFill: ghost ? "var(--ink)" : null, // 옅은 면 위에서는 흰 글씨가 읽히지 않는다
  };
}
