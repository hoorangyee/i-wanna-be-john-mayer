import { createContext, useContext, useEffect, useState } from "react";
import { loadLang, saveLang, type Lang } from "./i18n";

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// Provider 부재 시 en 고정 — 컴포넌트 단독 렌더 테스트가 영어 기본으로 동작
const LangContext = createContext<LangValue>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(loadLang()); // SSR 하이드레이션 후 실제 설정 반영
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    saveLang(next);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  return useContext(LangContext);
}
