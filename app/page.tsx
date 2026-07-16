"use client";

import { useState, useEffect } from "react";
import { scaleNoteMap, SCALES } from "@/theory/scales";
import { chordNoteMap, CHORDS } from "@/theory/chords";
import { boxesFor } from "@/theory/boxes";
import { playPosition } from "@/audio/tone";
import { Fretboard } from "@/components/Fretboard";
import { Controls } from "@/components/Controls";
import { ModeTabs } from "@/components/ModeTabs";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Quiz } from "@/components/Quiz";
import { Legend } from "@/components/Legend";
import { parseViewQuery, viewQueryString, type UrlViewState } from "@/lib/viewUrl";

const DEFAULT_VIEW: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  chordId: "7",
  labelMode: "name",
  boxIndex: null,
  overlayRoot: "A",
};

function PickIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden="true">
      <path d="M12 2.5c-3.9 0-7.5 1.6-7.5 4.8 0 4.6 3.7 10.4 7.5 14.2 3.8-3.8 7.5-9.6 7.5-14.2 0-3.2-3.6-4.8-7.5-4.8z" />
    </svg>
  );
}

export default function Home() {
  const [view, setView] = useState<UrlViewState>(DEFAULT_VIEW);

  // 마운트 시 URL → 상태 (SSR/하이드레이션 후 1회)
  useEffect(() => {
    setView(parseViewQuery(window.location.search, DEFAULT_VIEW));
  }, []);

  // 상태 → URL (북마크 가능, 히스토리 오염 없이 replace)
  useEffect(() => {
    const q = viewQueryString(view, DEFAULT_VIEW);
    window.history.replaceState(null, "", q || window.location.pathname);
  }, [view]);

  const isChord = view.mode === "chord";
  const isOverlay = view.mode === "overlay";
  const isQuiz = view.mode === "quiz";

  const notes = isChord
    ? chordNoteMap(view.keySel, view.chordId)
    : scaleNoteMap(view.keySel, view.scaleId);
  const overlayNotes = isOverlay ? chordNoteMap(view.overlayRoot, view.chordId) : undefined;
  const boxes = view.mode === "scale" ? boxesFor(view.keySel, view.scaleId) : null;
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  const title = isChord
    ? `${view.keySel}${CHORDS[view.chordId].symbol} — ${CHORDS[view.chordId].name} 코드톤`
    : isOverlay
      ? `${view.keySel} ${SCALES[view.scaleId].name} + ${view.overlayRoot}${CHORDS[view.chordId].symbol} 코드톤`
      : `${view.keySel} ${SCALES[view.scaleId].name}${view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}`;

  const legendMode = isChord ? "chord" : isOverlay ? "overlay" : "scale";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <h1 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <PickIcon />
            Fretboard
          </h1>
          <nav className="order-last w-full sm:order-none sm:w-auto sm:flex-1" aria-label="모드 전환">
            <div className="flex sm:justify-center">
              <ModeTabs mode={view.mode} onSelect={(patch) => setView((v) => ({ ...v, ...patch }))} />
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-5 sm:px-6">
        {isQuiz ? (
          <Quiz />
        ) : (
          <>
            {/* key={view.mode}: 모드 전환 시 내용 페이드 재생 */}
            <div key={view.mode}
                 className="card mb-4 min-h-[76px] px-4 py-3 animate-[fade-in_150ms_ease-out]">
              <Controls
                mode={view.mode}
                keySel={view.keySel}
                scaleId={view.scaleId}
                chordId={view.chordId}
                labelMode={view.labelMode}
                boxIndex={view.boxIndex}
                boxCount={boxes ? boxes.length : null}
                overlayRoot={view.overlayRoot}
                onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
              />
            </div>
            <section className="card">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
                <div className="flex flex-col gap-2.5">
                  <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
                  <Legend mode={legendMode} />
                </div>
              </div>
              <div className="board-scroll px-5 py-4">
                <Fretboard
                  notes={notes}
                  labelMode={view.labelMode}
                  window={activeWindow}
                  colorMode={isChord ? "degree" : "root"}
                  overlay={overlayNotes}
                  onNoteClick={playPosition}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
