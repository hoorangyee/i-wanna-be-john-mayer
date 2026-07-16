import type { Metadata } from "next";
import { THEME_KEY } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretboard — i wanna be john mayer",
  description: "기타 지판 스케일/코드톤 시각화 학습 도구",
};

// 페인트 전에 저장된 테마 선호를 해석해 <html data-theme>을 설정 (FOUC 방지).
// 저장소 차단 등 실패 시 시스템 다크 여부만으로 동작.
const THEME_INIT = `(function(){var t="light";try{var p=localStorage.getItem(${JSON.stringify(
  THEME_KEY
)});if(p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))t="dark"}catch(e){}document.documentElement.dataset.theme=t})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
