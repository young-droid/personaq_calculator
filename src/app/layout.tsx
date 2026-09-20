import type { Metadata } from "next";
import "./globals.css";

// next/font/google(Geist)는 빌드할 때 Google Fonts 서버로 폰트를 받아와야 하는데,
// 네트워크가 막힌 환경(예: 이 개발 샌드박스)에서는 빌드가 실패해.
// 한글도 어차피 Geist가 지원 안 하니, 그냥 시스템 폰트를 쓰도록 뺐어.
export const metadata: Metadata = {
  title: "페르소나Q 합체 계산기",
  description: "Persona Q 합체 계산기 (Next.js 연습용)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
