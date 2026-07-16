import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/audio/tone";

export function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundEnabled()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
  };

  return (
    <button className="secondary sound-toggle" aria-pressed={on} onClick={toggle}>
      {on ? "🔊 소리 켬" : "🔇 소리 끔"}
    </button>
  );
}
