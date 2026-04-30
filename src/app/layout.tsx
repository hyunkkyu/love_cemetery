import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { NavBar } from "@/components/NavBar"
import { FeedbackWidget } from "@/components/FeedbackWidget"
import { SessionGuard } from "@/components/SessionGuard"
import { DailyFortune } from "@/components/DailyFortune"

export const metadata: Metadata = {
  title: "명예의전당 | Hall of Fame",
  description: "지난 연애를 기리고, 만세력으로 분석하는 공간",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Gowun+Batang:wght@400;700&family=Cute+Font&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          {/* 배경 안개 레이어 */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="fog-layer absolute inset-0 bg-gradient-to-r from-fog via-transparent to-fog" />
            <div
              className="fog-layer absolute inset-0 bg-gradient-to-b from-transparent via-fog to-transparent"
              style={{ animationDelay: "7s" }}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="relative z-10">
            <NavBar />
            <main className="max-w-6xl mx-auto px-4 py-8">
              {children}
            </main>
          </div>
          <SessionGuard />
          <DailyFortune />
          <FeedbackWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
