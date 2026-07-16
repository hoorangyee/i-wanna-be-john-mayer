import { useEffect, useState } from "react";
import {
  applyTheme, loadThemePref, nextThemePref, resolveTheme, saveThemePref, type ThemePref,
} from "@/lib/theme";

const LABELS: Record<ThemePref, string> = {
  system: "테마: 시스템",
  light: "테마: 라이트",
  dark: "테마: 다크",
};

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
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    setPref(loadThemePref()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  // 시스템 모드일 때만 OS 테마 변경을 실시간 반영
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(resolveTheme("system", mq.matches));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [pref]);

  const cycle = () => {
    const next = nextThemePref(pref);
    setPref(next);
    saveThemePref(next);
    applyTheme(resolveTheme(next, window.matchMedia("(prefers-color-scheme: dark)").matches));
  };

  return (
    <button type="button" className="icon-btn" aria-label={LABELS[pref]} title={LABELS[pref]}
            onClick={cycle}>
      {pref === "system" ? <SystemIcon /> : pref === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
