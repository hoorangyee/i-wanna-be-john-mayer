import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/audio/tone";
import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

function VolumeOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="m16 9 5 5M21 9l-5 5" />
    </svg>
  );
}

export function SoundToggle() {
  const { lang } = useLang();
  const m = MESSAGES[lang];
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundEnabled()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
  };

  const label = on ? m.soundOn : m.soundOff;

  return (
    <button type="button" className="icon-btn" aria-pressed={on} aria-label={label} title={label}
            onClick={toggle}>
      {on ? <VolumeOnIcon /> : <VolumeOffIcon />}
    </button>
  );
}
