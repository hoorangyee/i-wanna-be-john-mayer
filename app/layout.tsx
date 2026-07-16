import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretboard — i wanna be john mayer",
  description: "기타 지판 스케일/코드톤 시각화 학습 도구",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
