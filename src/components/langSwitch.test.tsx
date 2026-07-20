import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LangProvider } from "@/lib/LangContext";
import { Controls } from "./Controls";
import { Legend } from "./Legend";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.lang = "";
});

const controlsProps = {
  mode: "scale" as const,
  keySel: "A" as const,
  scaleId: "minorPentatonic" as const,
  quality: "dominant" as const,
  exts: [] as const,
  labelMode: "name" as const,
  boxIndex: null,
  boxCount: 5,
  overlayRoot: "A" as const,
  onChange: () => {},
};

describe("language switching", () => {
  it("renders Korean labels when the stored language is ko", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByLabelText, getByRole } = render(
      <LangProvider>
        <Controls {...controlsProps} />
        <Legend mode="scale" />
      </LangProvider>
    );
    expect(getByLabelText("키")).not.toBeNull();
    expect(getByLabelText("스케일")).not.toBeNull();
    expect(getByRole("group", { name: "포지션" })).not.toBeNull();
    expect(getByRole("option", { name: "마이너 펜타토닉" })).not.toBeNull();
  });

  it("defaults to English inside the provider when nothing is stored", () => {
    const { getByLabelText } = render(
      <LangProvider><Controls {...controlsProps} /></LangProvider>
    );
    expect(getByLabelText("Key")).not.toBeNull();
  });

  it("renders Korean quality names in chord mode", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByRole } = render(
      <LangProvider><Controls {...controlsProps} mode="chord" /></LangProvider>
    );
    expect(getByRole("option", { name: "디미니시드" })).not.toBeNull();
    expect(getByRole("option", { name: "하프 디미니시드" })).not.toBeNull();
    expect(getByRole("option", { name: "어그먼티드" })).not.toBeNull();
  });

  it("speaks altered pill names in Korean", () => {
    window.localStorage.setItem("fretboard-lang", "ko");
    const { getByRole } = render(
      <LangProvider><Controls {...controlsProps} mode="chord" /></LangProvider>
    );
    expect(getByRole("button", { name: "b9, 플랫 9도" })).not.toBeNull();
  });
});
