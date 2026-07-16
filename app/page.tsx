"use client";

import { useState } from "react";
import type { Key } from "@/theory/notes";
import { scaleNoteMap, SCALES, type ScaleId } from "@/theory/scales";
import { chordNoteMap, CHORDS, type ChordId } from "@/theory/chords";
import { boxesFor } from "@/theory/boxes";
import { Fretboard, type LabelMode } from "@/components/Fretboard";
import { Controls, type Mode } from "@/components/Controls";
import { Quiz } from "@/components/Quiz";

interface ViewState {
  mode: Mode;
  keySel: Key;
  scaleId: ScaleId;
  chordId: ChordId;
  labelMode: LabelMode;
  boxIndex: number | null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>({
    mode: "scale",
    keySel: "A",
    scaleId: "minorPentatonic",
    chordId: "7",
    labelMode: "name",
    boxIndex: null,
  });

  const isChord = view.mode === "chord";
  const isQuiz = view.mode === "quiz";
  const notes = isChord
    ? chordNoteMap(view.keySel, view.chordId)
    : scaleNoteMap(view.keySel, view.scaleId);
  const boxes = isChord ? null : boxesFor(view.keySel, view.scaleId);
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  const title = isChord
    ? `${view.keySel}${CHORDS[view.chordId].symbol} — ${CHORDS[view.chordId].name} 코드톤`
    : `${view.keySel} ${SCALES[view.scaleId].name}${view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}`;

  return (
    <main>
      <header className="topbar">
        <h1>Fretboard</h1>
        <Controls
          mode={view.mode}
          keySel={view.keySel}
          scaleId={view.scaleId}
          chordId={view.chordId}
          labelMode={view.labelMode}
          boxIndex={view.boxIndex}
          boxCount={boxes ? boxes.length : null}
          onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
        />
      </header>
      {isQuiz ? (
        <Quiz />
      ) : (
        <section className="board">
          <h2 className="view-title">{title}</h2>
          <Fretboard
            notes={notes}
            labelMode={view.labelMode}
            window={activeWindow}
            colorMode={isChord ? "degree" : "root"}
          />
        </section>
      )}
    </main>
  );
}
