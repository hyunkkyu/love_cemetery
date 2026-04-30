"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const STEPS = [
  {
    emoji: "👻",
    title: "명예의전당에 오신 걸 환영해요!",
    desc: "이곳은 지난 연애를 기리고, 새로운 사랑을 준비하는 공간이에요.",
  },
  {
    emoji: "🪦",
    title: "묘비 세우기",
    desc: "과거 연인의 정보를 등록하면 만세력 궁합, 카톡 분석까지 해드려요.\n묘비를 세울 때마다 코인을 받아요!",
    link: "/grave",
    linkText: "묘지 관리 →",
  },
  {
    emoji: "🔮",
    title: "만세력 & 궁합 분석",
    desc: "생년월일시를 입력하면 사주팔자를 계산하고,\n천간합·지지육합·십성 등 10가지 항목으로 궁합을 분석해요.",
    link: "/manseryeok",
    linkText: "만세력 보기 →",
  },
  {
    emoji: "💘",
    title: "살랑살랑",
    desc: "지금 만나는 사람의 궁합을 보고,\n과거 연애와 비교 분석해서 AI가 조언해줘요.",
    link: "/love",
    linkText: "살랑살랑 →",
  },
  {
    emoji: "👻",
    title: "커뮤니티 & 동반자",
    desc: "다른 유령들과 연애 이야기를 나누고,\n영혼의동반자를 맺으면 서로의 묘비에 조언을 남길 수 있어요.",
    link: "/community",
    linkText: "커뮤니티 →",
  },
  {
    emoji: "🧙",
    title: "연애 상담소",
    desc: "AI 전문 상담사에게 맞춤 상담을 받아보세요.\n하루 3회 무료, 이후 20코인이에요.",
    link: "/counsel",
    linkText: "상담 받기 →",
  },
  {
    emoji: "🛒",
    title: "상점 & 꾸미기",
    desc: "픽셀아트 아이템으로 묘비를 꾸밀 수 있어요.\n코인으로 구매하고 드래그해서 배치하세요!",
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

  const handleClose = () => {
    setShow(false)
    localStorage.setItem("tutorial-done", "1")
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 max-w-sm w-full space-y-5 animate-fade-in">
        {/* 진행 바 */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={"h-1 flex-1 rounded-full transition-all " +
                (i <= step ? "bg-cemetery-accent" : "bg-cemetery-border")}
            />
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="text-center space-y-3">
          <div className="text-5xl ghost-float inline-block">{current.emoji}</div>
          <h2 className="font-gothic text-lg font-bold text-cemetery-heading">
            {current.title}
          </h2>
          <p className="text-sm text-cemetery-text leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>
          {current.link && (
            <a
              href={current.link}
              onClick={handleClose}
              className="inline-block text-xs text-cemetery-accent hover:underline mt-1"
            >
              {current.linkText}
            </a>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          {step > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
                text-sm text-cemetery-ghost transition-colors"
            >
              ← 이전
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
                text-sm text-cemetery-ghost transition-colors"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl
              text-sm font-semibold transition-colors cute-press"
          >
            {isLast ? "시작하기! 👻" : "다음 →"}
          </button>
        </div>

        {/* 스텝 */}
        <p className="text-center text-[10px] text-cemetery-ghost/30">
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  )
}
