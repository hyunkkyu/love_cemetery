"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const STEPS = [
  {
    emoji: "👻",
    title: "명예의전당에 오신 걸\n환영해요!",
    desc: "지난 연애를 기리고,\n새로운 사랑을 준비하는 공간이에요.",
  },
  {
    emoji: "🪦",
    title: "묘비 세우기",
    desc: "과거 연인의 정보를 등록하면\n만세력 궁합, 카톡 분석까지!\n묘비를 세울 때마다 코인을 받아요.",
    link: "/grave",
    linkText: "묘지 관리 →",
  },
  {
    emoji: "🔮",
    title: "종합 운명 분석",
    desc: "사주명리·자미두수·수비학·점성학\n6가지 학문 교차검증 분석.\n궁금한 점도 자유롭게 질문 가능!",
    link: "/manseryeok",
    linkText: "운명 분석 →",
  },
  {
    emoji: "💘",
    title: "살랑살랑",
    desc: "지금 만나는 사람의 궁합을 보고\n과거 연애와 비교 분석해줘요.",
    link: "/love",
    linkText: "살랑살랑 →",
  },
  {
    emoji: "💔",
    title: "썸붕 분석실",
    desc: "썸이 왜 깨졌는지\n객관적으로 분석해드려요.\n내 의견 vs AI 분석 비교!",
    link: "/ssum",
    linkText: "썸붕 분석 →",
  },
  {
    emoji: "👻",
    title: "커뮤니티 & 동반자",
    desc: "다른 유령들과 연애 이야기를 나누고\n영혼의동반자와 서로 묘비에 조언해요.",
    link: "/community",
    linkText: "커뮤니티 →",
  },
  {
    emoji: "🧙",
    title: "연애 상담소",
    desc: "AI 전문 상담사에게 맞춤 상담!\n하루 3회 무료, 이후 20코인.",
    link: "/counsel",
    linkText: "상담 받기 →",
  },
  {
    emoji: "🛒",
    title: "상점 & 꾸미기",
    desc: "픽셀아트 아이템으로 묘비를 꾸며요.\n코인으로 구매하고 드래그 배치!",
    link: "/shop",
    linkText: "상점 가기 →",
  },
]

export function Tutorial() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!session?.user) return
    const key = "tutorial-done"
    if (localStorage.getItem(key)) return
    setShow(true)
  }, [session])

  // 외부에서 트리거 가능하도록 이벤트 리스너
  useEffect(() => {
    const handler = () => {
      setStep(0)
      setShow(true)
    }
    window.addEventListener("show-tutorial", handler)
    return () => window.removeEventListener("show-tutorial", handler)
  }, [])

  const handleClose = () => {
    setShow(false)
    localStorage.setItem("tutorial-done", "1")
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else handleClose()
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[180] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-cemetery-card border border-cemetery-border
        sm:rounded-2xl rounded-t-2xl
        p-5 sm:p-6 w-full sm:max-w-sm space-y-4 animate-fade-in
        max-h-[85vh] overflow-y-auto">

        {/* 진행 바 */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i}
              className={"h-1.5 flex-1 rounded-full transition-all " +
                (i <= step ? "bg-cemetery-accent" : "bg-cemetery-border")}
            />
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="text-center space-y-3 py-2">
          <div className="text-5xl ghost-float inline-block">{current.emoji}</div>
          <h2 className="font-gothic text-lg sm:text-xl font-bold text-cemetery-heading whitespace-pre-line leading-snug">
            {current.title}
          </h2>
          <p className="text-sm text-cemetery-text leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>
          {current.link && (
            <a href={current.link} onClick={handleClose}
              className="inline-block text-xs text-cemetery-accent hover:underline mt-1">
              {current.linkText}
            </a>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          {step > 0 ? (
            <button onClick={handlePrev}
              className="flex-1 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-sm text-cemetery-ghost transition-colors">
              ← 이전
            </button>
          ) : (
            <button onClick={handleClose}
              className="flex-1 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-sm text-cemetery-ghost transition-colors">
              건너뛰기
            </button>
          )}
          <button onClick={handleNext}
            className="flex-1 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors cute-press">
            {isLast ? "시작하기! 👻" : "다음 →"}
          </button>
        </div>

        <p className="text-center text-[10px] text-cemetery-ghost/30">
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  )
}
