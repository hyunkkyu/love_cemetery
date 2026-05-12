"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Grave } from "@/types"
import { GraveCard } from "@/components/GraveCard"
import { dbGraves } from "@/lib/api-client"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"
import { WeeklyReport } from "@/components/WeeklyReport"
import { LandingIntro } from "@/components/LandingIntro"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [graves, setGraves] = useState<Grave[]>([])
  const [showIntro, setShowIntro] = useState(true)
  const [introPhase, setIntroPhase] = useState(0)
  const userId = (session?.user as { id?: string })?.id

  useEffect(() => {
    if (userId) dbGraves.list(userId).then((d) => setGraves(d || []))
  }, [userId])

  // 오프닝 애니메이션 시퀀스 (계정당 1회만)
  useEffect(() => {
    if (!session?.user) return
    const hasSeenIntro = localStorage.getItem("intro-seen-permanent")
    if (hasSeenIntro) {
      setShowIntro(false)
      return
    }
    const timers = [
      setTimeout(() => setIntroPhase(1), 500),
      setTimeout(() => setIntroPhase(2), 1500),
      setTimeout(() => setIntroPhase(3), 2500),
      setTimeout(() => setIntroPhase(4), 3500),
      setTimeout(() => {
        setShowIntro(false)
        localStorage.setItem("intro-seen-permanent", "1")
      }, 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [session])

  // 비로그인 → 랜딩 페이지
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-cemetery-ghost/40 text-sm animate-pulse">불러오는 중...</div>
      </div>
    )
  }

  if (!session?.user) {
    return <LandingIntro />
  }

  // 으스스한 오프닝
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* 페이즈별 등장 */}
          <div className={`transition-all duration-1000 ${introPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="flex justify-center mb-4">
              <PixelArt grid={PIXEL_ARTS["ghost-main"]} scale={6} animated />
            </div>
          </div>

          <div className={`transition-all duration-1000 ${introPhase >= 2 ? "opacity-100" : "opacity-0"}`}>
            <p className="text-cemetery-ghost/60 text-sm tracking-[0.3em]">
              당신의 지난 연애가 잠든 곳
            </p>
          </div>

          <div className={`transition-all duration-1000 ${introPhase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
            <h1 className="font-gothic text-5xl font-black text-cemetery-heading intro-glow">
              명예의전당
            </h1>
          </div>

          <div className={`transition-all duration-700 ${introPhase >= 4 ? "opacity-100" : "opacity-0"}`}>
            <p className="text-cemetery-ghost/40 text-xs animate-pulse">
              입장 중...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* 메인: 스크롤 없이 한 화면에 */}
      <section className="text-center py-8 sm:py-12 space-y-5">
        <div className="flex justify-center">
          <PixelArt grid={PIXEL_ARTS["ghost-main"]} scale={4} animated />
        </div>
        <p className="text-cemetery-ghost/60 text-sm">
          지난 연애를 묻고, 운명을 분석하세요.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <a href="/grave"
            className="px-10 py-4 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-2xl
              font-bold text-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cemetery-accent/30 cute-press">
            🪦 묘비 세우기
          </a>
          <a href="/manseryeok"
            className="px-5 py-2.5 bg-cemetery-card border border-cemetery-border hover:border-cemetery-accent
              rounded-xl text-sm text-cemetery-ghost transition-colors">
            🔮 운명 분석
          </a>
        </div>
      </section>

      {/* 묘지 전경 */}
      {graves.length > 0 && (
        <section className="space-y-4 mt-4">
          <h2 className="font-gothic text-lg text-cemetery-heading flex items-center gap-2">
            <span className="candle-glow inline-block">🕯️</span>
            이곳에 잠든 연애들
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graves.map((grave) => (
              <GraveCard key={grave.id} grave={grave} />
            ))}
          </div>
        </section>
      )}

      {/* 빈 묘지 */}
      {graves.length === 0 && (
        <section className="text-center py-8 space-y-3">
          <div className="flex justify-center">
            <PixelArt grid={PIXEL_ARTS["stone-marble"]} scale={4} />
          </div>
          <p className="text-cemetery-ghost/50 text-sm">
            아직 묻힌 연애가 없습니다
          </p>
          <p className="text-cemetery-ghost/30 text-xs">
            묘비를 세우면 🪙 100~400코인 보상
          </p>
        </section>
      )}

      {/* 주간 리포트 */}
      <WeeklyReport />
    </div>
  )
}

