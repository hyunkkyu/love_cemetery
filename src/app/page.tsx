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

  // 오프닝 애니메이션 시퀀스 (로그인 유저만)
  useEffect(() => {
    if (!session?.user) return
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

      {/* 빈 묘지 → 첫 묘비 유도 */}
      {graves.length === 0 && (
        <section className="text-center py-12 space-y-5">
          <div className="flex justify-center">
            <PixelArt grid={PIXEL_ARTS["stone-marble"]} scale={5} />
          </div>
          <h2 className="text-cemetery-heading text-xl font-bold">
            첫 묘비를 세워볼까요?
          </h2>
          <p className="text-cemetery-ghost/60 text-sm max-w-sm mx-auto leading-relaxed">
            닉네임만 입력하면 30초면 끝!<br />
            묘비를 세우면 사주 궁합 분석 + 코인 보상까지 받아요.
          </p>
          <a href="/grave"
            className="inline-block px-8 py-4 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-2xl
              font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cemetery-accent/30 cute-press">
            🪦 첫 묘비 세우기
          </a>
          <p className="text-cemetery-ghost/30 text-xs">
            등급에 따라 🪙 100~400코인 보상
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
            desc="과거 연인 정보를 등록하면 사주 궁합, 카톡 분석까지."
            cost="🪙 +100~400 보상" href="/grave" color="text-cemetery-accent"
          />
          <GuideStep
            step="2" emoji="🔮" title="종합 운명 분석"
            desc="사주/점성/수비학 등 6가지 학문으로 교차검증 분석!"
            cost="무료 (추가질문 50코인)" href="/manseryeok" color="text-blue-400"
          />
          <GuideStep
            step="3" emoji="💘" title="살랑살랑 (현재 썸)"
            desc="지금 만나는 사람의 궁합을 보고, 과거와 비교 분석."
            cost="무료" href="/love" color="text-pink-400"
          />
          <GuideStep
            step="4" emoji="💔" title="썸붕 분석 (썸 깨진 이유)"
            desc="사주 + 연애고수 관점으로 팩폭. 강도 조절 가능!"
            cost="무료" href="/ssum" color="text-red-400"
          />
          <GuideStep
            step="5" emoji="👻" title="커뮤니티"
            desc="다른 유령들과 연애 이야기를 나누고 조언해요."
            cost="글 작성 +10코인" href="/community" color="text-purple-400"
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

function GuideStep({ step, emoji, title, desc, cost, href, color }: {
  step: string; emoji: string; title: string; desc: string; cost: string; href: string; color: string
}) {
  return (
    <a href={href} className="flex gap-3 p-4 bg-cemetery-card border border-cemetery-border rounded-2xl tombstone-hover transition-all">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cemetery-surface flex items-center justify-center">
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={"text-xs font-bold " + color}>STEP {step}</span>
          <span className="text-sm font-semibold text-cemetery-heading">{title}</span>
        </div>
        <p className="text-xs text-cemetery-ghost/60 mt-0.5 leading-relaxed">{desc}</p>
        <p className="text-xs text-yellow-400/60 mt-1">{cost}</p>
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
