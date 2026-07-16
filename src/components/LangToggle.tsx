import { MESSAGES } from "@/lib/i18n";
import { useLang } from "@/lib/LangContext";

export function LangToggle() {
  const { lang, setLang } = useLang();
  const label = MESSAGES[lang].langLabel;
  return (
    <button type="button" className="icon-btn w-auto px-2.5 text-xs font-semibold tracking-wide"
            aria-label={label} title={label}
            onClick={() => setLang(lang === "en" ? "ko" : "en")}>
      {lang === "en" ? "EN" : "KO"}
    </button>
  );
}
