"use client";

import { useState } from "react";
import type { Key } from "@/theory/notes";
import { scaleNoteMap, SCALES, type ScaleId } from "@/theory/scales";
import { boxesFor } from "@/theory/boxes";
import { Fretboard, type LabelMode } from "@/components/Fretboard";
import { Controls } from "@/components/Controls";

interface ViewState {
  keySel: Key;
  scaleId: ScaleId;
  labelMode: LabelMode;
  boxIndex: number | null;
}

export default function Home() {
  const [view, setView] = useState<ViewState>({
    keySel: "A",
    scaleId: "minorPentatonic",
    labelMode: "name",
    boxIndex: null,
  });

  const notes = scaleNoteMap(view.keySel, view.scaleId);
  const boxes = boxesFor(view.keySel, view.scaleId);
  const activeWindow = view.boxIndex !== null && boxes ? boxes[view.boxIndex] : null;

  return (
    <main>
      <header className="topbar">
        <h1>Fretboard</h1>
        <Controls
          keySel={view.keySel}
          scaleId={view.scaleId}
          labelMode={view.labelMode}
          boxIndex={view.boxIndex}
          boxCount={boxes ? boxes.length : null}
          onChange={(patch) => setView((v) => ({ ...v, ...patch }))}
        />
      </header>
      <section className="board">
        <h2 className="view-title">
          {view.keySel} {SCALES[view.scaleId].name}
          {view.boxIndex !== null ? ` — 박스 ${view.boxIndex + 1}` : ""}
        </h2>
        <Fretboard notes={notes} labelMode={view.labelMode} window={activeWindow} />
      </section>
    </main>
  );
}
