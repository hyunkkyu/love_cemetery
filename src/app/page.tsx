"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Grave } from "@/types"
import { GraveCard } from "@/components/GraveCard"
import { dbGraves } from "@/lib/api-client"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"
import { WeeklyReport } from "@/components/WeeklyReport"

export default function HomePage() {
  const { data: session } = useSession()
  const [graves, setGraves] = useState<Grave[]>([])
  const [showIntro, setShowIntro] = useState(true)
  const [introPhase, setIntroPhase] = useState(0)
  const userId = (session?.user as { id?: string })?.id

  useEffect(() => {
    if (userId) dbGraves.list(userId).then((d) => setGraves(d || []))
  }, [userId])

  // 오프닝 애니메이션 시퀀스
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("intro-seen")
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
        sessionStorage.setItem("intro-seen", "1")
      }, 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

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
    <div className="space-y-12 animate-fade-in">
      {/* 히어로 */}
      <section className="text-center py-16 space-y-6">
        <div className="flex justify-center mb-4">
          <PixelArt grid={PIXEL_ARTS["ghost-main"]} scale={5} animated />
        </div>
        <h1 className="font-gothic text-4xl md:text-5xl font-black text-cemetery-heading">
          명예의전당
        </h1>
        <p className="text-cemetery-ghost text-lg max-w-xl mx-auto">
          지난 연애를 이곳에 묻어두세요.<br />
          만세력과 카톡 분석으로 과거를 돌아보고,<br />
          새로운 인연과 비교해보세요.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/grave"
            className="px-6 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-lg font-semibold transition-colors"
          >
            🪦 묘비 세우기
          </a>
          <a
            href="/manseryeok"
            className="px-6 py-3 bg-cemetery-card border border-cemetery-border hover:border-cemetery-accent rounded-lg transition-colors"
          >
            🔮 만세력 보기
          </a>
        </div>
      </section>

      {/* 묘지 전경 */}
      {graves.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-gothic text-2xl text-cemetery-heading flex items-center gap-2">
            <span className="candle-glow inline-block">🕯️</span>
            이곳에 잠든 연애들
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {graves.map((grave) => (
              <GraveCard key={grave.id} grave={grave} />
            ))}
          </div>
        </section>
      )}

      {/* 빈 묘지 */}
      {graves.length === 0 && (
        <section className="text-center py-20 space-y-4">
          <div className="flex justify-center">
            <PixelArt grid={PIXEL_ARTS["stone-marble"]} scale={5} />
          </div>
          <p className="text-cemetery-ghost text-lg">
            아직 묻힌 연애가 없습니다
          </p>
          <p className="text-cemetery-ghost/60 text-sm">
            첫 번째 묘비를 세워보세요
          </p>
        </section>
      )}

      {/* 주간 리포트 */}
      <WeeklyReport />

      {/* 기능 안내 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <FeatureCard
          pixelArtId="deco-photo"
          title="카톡 분석"
          description="카카오톡 대화 파일을 업로드하면 대화 패턴, 감정 온도, 응답 속도 등을 분석합니다."
        />
        <FeatureCard
          pixelArtId="candle-eternal"
          title="만세력 궁합"
          description="생년월일시를 입력하면 사주팔자를 계산하고 두 사람의 궁합을 분석합니다."
        />
        <FeatureCard
          pixelArtId="special-fairy"
          title="비교 분석"
          description="과거 연인과 새로운 만남을 비교 분석하여 패턴과 차이를 보여줍니다."
        />
      </section>
    </div>
  )
}

function FeatureCard({
  pixelArtId,
  title,
  description,
}: {
  pixelArtId: string
  title: string
  description: string
}) {
  const grid = PIXEL_ARTS[pixelArtId]
  return (
    <div className="tombstone-hover p-6 bg-cemetery-card border border-cemetery-border rounded-xl text-center">
      <div className="flex justify-center mb-4">
        {grid && <PixelArt grid={grid} scale={4} />}
      </div>
      <h3 className="font-gothic text-lg font-bold text-cemetery-heading mb-2">
        {title}
      </h3>
      <p className="text-cemetery-ghost text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}
