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
        {/* 코인 표시 */}
        <CoinBadge />

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

      {/* 이렇게 사용하세요 */}
      <section className="space-y-4">
        <h2 className="font-gothic text-xl text-cemetery-heading text-center">
          🗺️ 이렇게 사용하세요
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <GuideStep
            step="1" emoji="🪦" title="묘비 세우기"
            desc="과거 연인 정보를 등록하면 사주 궁합, 카톡 분석까지. 등급별 코인 보상!"
            href="/grave" color="text-cemetery-accent"
          />
          <GuideStep
            step="2" emoji="🔮" title="운명 분석"
            desc="6가지 학문 교차검증! 궁금한 주제를 선택하거나 자유롭게 질문하세요."
            href="/manseryeok" color="text-blue-400"
          />
          <GuideStep
            step="3" emoji="💘" title="살랑살랑"
            desc="지금 만나는 사람의 궁합을 보고, 과거 연애와 비교해서 AI가 조언해줘요."
            href="/love" color="text-pink-400"
          />
          <GuideStep
            step="4" emoji="💔" title="썸붕 분석"
            desc="썸이 왜 깨졌는지 사주 + 연애고수 관점으로. 팩폭 강도도 조절 가능!"
            href="/ssum" color="text-red-400"
          />
          <GuideStep
            step="5" emoji="🧙" title="연애 상담"
            desc="내 기록을 바탕으로 AI 상담사가 맞춤 조언. 하루 3회 무료!"
            href="/counsel" color="text-green-400"
          />
          <GuideStep
            step="6" emoji="👻" title="커뮤니티"
            desc="다른 유령들과 연애 이야기를 나누고, 동반자와 서로 묘비에 향을 피워요."
            href="/community" color="text-purple-400"
          />
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <a href="/shop" className="px-4 py-2 bg-cemetery-card border border-cemetery-border rounded-xl text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
            🛒 상점
          </a>
          <a href="/stats" className="px-4 py-2 bg-cemetery-card border border-cemetery-border rounded-xl text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
            📊 통계
          </a>
          <a href="/invite" className="px-4 py-2 bg-cemetery-card border border-cemetery-border rounded-xl text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
            🎁 초대
          </a>
          <a href="/notice" className="px-4 py-2 bg-cemetery-card border border-cemetery-border rounded-xl text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
            📢 공지
          </a>
        </div>
      </section>
    </div>
  )
}

function GuideStep({ step, emoji, title, desc, href, color }: {
  step: string; emoji: string; title: string; desc: string; href: string; color: string
}) {
  return (
    <a href={href} className="flex gap-3 p-4 bg-cemetery-card border border-cemetery-border rounded-2xl tombstone-hover transition-all">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cemetery-surface flex items-center justify-center">
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={"text-[10px] font-bold " + color}>STEP {step}</span>
          <span className="text-sm font-semibold text-cemetery-heading">{title}</span>
        </div>
        <p className="text-xs text-cemetery-ghost/60 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </a>
  )
}

function CoinBadge() {
  const [coins, setCoins] = useState<number | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.get" }),
    }).then(r => r.json()).then(d => setCoins(d.data?.coins ?? null)).catch(() => {})
  }, [session])

  if (coins === null) return null

  return (
    <a href="/mypage"
      className="inline-flex items-center gap-2 px-4 py-2 bg-cemetery-card border border-yellow-500/20 rounded-full
        hover:border-yellow-500/40 transition-colors">
      <span className="text-yellow-400 font-bold">🪙 {coins.toLocaleString()}</span>
      <span className="text-[10px] text-cemetery-ghost/40">마이페이지 →</span>
    </a>
  )
}
