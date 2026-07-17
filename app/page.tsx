"use client";

import { useState, useEffect } from "react";
import { scaleNoteMap } from "@/theory/scales";
import { chordSymbol, chordToneMap } from "@/theory/chords";
import { boxesFor } from "@/theory/boxes";
import { playPosition } from "@/audio/tone";
import { Fretboard } from "@/components/Fretboard";
import { Controls } from "@/components/Controls";
import { ModeTabs } from "@/components/ModeTabs";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { Quiz } from "@/components/Quiz";
import { Legend } from "@/components/Legend";
import { parseViewQuery, viewQueryString, type UrlViewState } from "@/lib/viewUrl";
import { MESSAGES, SCALE_NAMES, QUALITY_NAMES } from "@/lib/i18n";
import { LangProvider, useLang } from "@/lib/LangContext";

const DEFAULT_VIEW: UrlViewState = {
  mode: "scale",
  keySel: "A",
  scaleId: "minorPentatonic",
  quality: "dominant",
  exts: [],
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

function HomeInner() {
  const { lang } = useLang();
  const m = MESSAGES[lang];
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
    ? chordToneMap(view.keySel, view.quality, view.exts)
    : scaleNoteMap(view.keySel, view.scaleId);
  const overlayNotes = isOverlay ? chordToneMap(view.overlayRoot, view.quality, view.exts) : undefined;
  const boxes = view.mode === "scale" ? boxesFor(view.keySel, view.scaleId) : null;
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  const scaleName = SCALE_NAMES[lang][view.scaleId];
  const symbol = chordSymbol(view.quality, view.exts);
  const title = isChord
    ? m.titleChord(view.keySel, symbol, QUALITY_NAMES[lang][view.quality])
    : isOverlay
      ? m.titleOverlay(view.keySel, scaleName, view.overlayRoot, symbol)
      : m.titleScale(view.keySel, scaleName, view.boxIndex);

  const legendMode = isChord ? "chord" : isOverlay ? "overlay" : "scale";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <h1 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <PickIcon />
            Fretboard
          </h1>
          <nav className="order-last w-full sm:order-none sm:w-auto sm:flex-1" aria-label={m.modeNav}>
            <div className="flex sm:justify-center">
              <ModeTabs mode={view.mode} onSelect={(patch) => setView((v) => ({ ...v, ...patch }))} />
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
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
            {/* 모드 전환 시 리마운트 없이 내용만 교체 — min-h로 높이 고정(깜빡임 방지) */}
            <div className="card mb-4 min-h-[76px] px-4 py-3">
              <Controls
                mode={view.mode}
                keySel={view.keySel}
                scaleId={view.scaleId}
                quality={view.quality}
                exts={view.exts}
                labelMode={view.labelMode}
                boxIndex={view.boxIndex}
                boxCount={boxes ? boxes.length : null}
                overlayRoot={view.overlayRoot}
                onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
              />
            </div>
            <section className="card">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5">
                <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
                <Legend mode={legendMode} exts={view.exts} />
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

export default function Home() {
  return (
    <LangProvider>
      <HomeInner />
    </LangProvider>
  );
}
