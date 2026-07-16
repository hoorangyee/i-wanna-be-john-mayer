import { useEffect, useState } from "react";
import {
  applyTheme, loadThemePref, nextThemePref, resolveTheme, saveThemePref, type ThemePref,
} from "@/lib/theme";
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const LABELS: Record<ThemePref, string> = {
    system: m.themeSystem,
    light: m.themeLight,
    dark: m.themeDark,
  };
  // null = 저장된 선호 로드 전 — 이때는 FOUC 스크립트가 설정한 data-theme을 건드리지 않는다
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    setPref(loadThemePref()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  // pref 확정/변경 시 해석값 적용, 시스템 모드일 때만 OS 테마 변경을 실시간 반영
  useEffect(() => {
    if (pref === null) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(resolveTheme(pref, mq.matches));
    sync();
    if (pref !== "system") return;
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pref]);

  const cycle = () => {
    const next = nextThemePref(pref ?? "system");
    setPref(next);
    saveThemePref(next);
    // applyTheme은 위 이펙트가 pref 변경에 반응해 수행 — 중복 적용 제거
  };

  const label = LABELS[pref ?? "system"];

  return (
    <button type="button" className="icon-btn" aria-label={label} title={label}
            onClick={cycle}>
      {(pref ?? "system") === "system" ? <SystemIcon /> : pref === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
