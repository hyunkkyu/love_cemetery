"use client"

import { useState, useEffect } from "react"

const STEPS = [
  {
    emoji: "👻",
    title: "당신의 연애는 왜 죽었을까?",
    desc: "과거 연애를 묻고, 운명을 분석하고\n새로운 인연을 찾아보세요.",
    bg: "from-purple-900/20",
  },
  {
    emoji: "🪦",
    title: "묘비 세우기",
    desc: "과거 연인 정보를 등록하면\n사주 궁합 + 카톡 분석까지!",
    bg: "from-indigo-900/20",
  },
  {
    emoji: "🔮",
    title: "6학문 종합 운명 분석",
    desc: "사주 · 점성 · 수비학 등\n6가지 학문으로 교차검증!",
    bg: "from-blue-900/20",
  },
  {
    emoji: "💘",
    title: "지금 바로 시작해보세요!",
    desc: "가입 없이 1회 무료 체험 가능!\n회원가입하면 500코인 + 무제한 이용.",
    bg: "from-cemetery-accent/20",
  },
]

export function Tutorial() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [hideToday, setHideToday] = useState(false)

  useEffect(() => {
    // "오늘 하루 보지 않기"가 오늘 날짜면 숨김
    const skipDate = localStorage.getItem("tutorial-skip-date")
    const today = new Date().toISOString().slice(0, 10)
    if (skipDate === today) return
    setShow(true)
  }, [])

  useEffect(() => {
    const handler = () => { setStep(0); setShow(true) }
    window.addEventListener("show-tutorial", handler)
    return () => window.removeEventListener("show-tutorial", handler)
  }, [])

  const handleClose = () => {
    if (hideToday) {
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem("tutorial-skip-date", today)
    }
    setShow(false)
  }

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[180] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={"bg-gradient-to-b " + current.bg + " to-cemetery-card border border-cemetery-border sm:rounded-2xl rounded-t-2xl p-5 sm:p-6 w-full sm:max-w-md space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"}>

        {/* 진행 바 */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={"h-1.5 flex-1 rounded-full transition-all duration-300 " + (i <= step ? "bg-cemetery-accent" : "bg-cemetery-border/50")} />
          ))}
        </div>

        {/* 스텝 번호 */}
        <p className="text-[10px] text-cemetery-ghost/30 text-center">
          {step + 1} / {STEPS.length}
        </p>

        {/* 콘텐츠 */}
        <div className="text-center space-y-3 py-1">
          <div className="text-5xl ghost-float inline-block">{current.emoji}</div>
          <h2 className="font-gothic text-xl font-bold text-cemetery-heading whitespace-pre-line leading-snug">
            {current.title}
          </h2>
          <p className="text-sm text-cemetery-text leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>
        </div>

        {/* 오늘 하루 보지 않기 */}
        <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideToday}
            onChange={(e) => setHideToday(e.target.checked)}
            className="w-4 h-4 rounded border-cemetery-border bg-cemetery-surface accent-cemetery-accent"
          />
          <span className="text-[11px] text-cemetery-ghost/50">오늘 하루 보지 않기</span>
        </label>

        {/* 버튼 */}
        <div className="flex gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-sm text-cemetery-ghost transition-colors">
              ← 이전
            </button>
          ) : (
            <button onClick={handleClose}
              className="flex-1 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-sm text-cemetery-ghost transition-colors">
              건너뛰기
            </button>
          )}
          <button onClick={() => isLast ? handleClose() : setStep(step + 1)}
            className="flex-1 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors cute-press">
            {isLast ? "시작하기! 👻" : "다음 →"}
          </button>
        </div>
      </div>
    </div>
  )
}
