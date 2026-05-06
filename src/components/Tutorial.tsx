"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const STEPS = [
  {
    emoji: "👻",
    title: "환영해요, 유령님!",
    desc: "이곳은 지난 연애를 기리고\n새로운 사랑을 준비하는 공간이에요.",
    detail: "가입 축하 코인 500개가 지급되었어요!",
    bg: "from-purple-900/20",
  },
  {
    emoji: "🪦",
    title: "Step 1. 묘비 세우기",
    desc: "과거 연인의 정보를 등록하면\n만세력 궁합부터 카톡 분석까지 해드려요.",
    detail: "🪙 묘비를 세우면 등급에 따라 100~400코인을 받아요!\n현충원 > 공동묘지 > 수장 순서로 등급이 높아요.",
    link: "/grave",
    linkText: "묘비 세우러 가기 →",
    bg: "from-indigo-900/20",
  },
  {
    emoji: "🔮",
    title: "Step 2. 운명 분석",
    desc: "사주명리 · 자미두수 · 수비학 · 점성학\n6가지 학문으로 교차검증 분석!",
    detail: "생년월일만 입력하면 끝!\n궁금한 점을 자유롭게 질문할 수도 있어요.\n분석 후 채팅으로 추가 질문 가능 (50코인/회)",
    link: "/manseryeok",
    linkText: "운명 분석 해보기 →",
    bg: "from-blue-900/20",
  },
  {
    emoji: "💘",
    title: "Step 3. 살랑살랑",
    desc: "지금 만나는 사람의 궁합을 분석하고\n과거 연애와 비교해줘요.",
    detail: "상대 생년월일만 있으면 OK!\nAI가 과거 패턴을 분석해서 조언해줘요.\n여러 명 저장해두고 비교 가능!",
    link: "/love",
    linkText: "살랑살랑 시작 →",
    bg: "from-pink-900/20",
  },
  {
    emoji: "💔",
    title: "Step 4. 썸붕 분석실",
    desc: "썸이 왜 깨졌는지\n사주 + 연애고수 관점으로 분석!",
    detail: "내가 생각하는 이유 vs AI의 객관적 분석\n팩폭 강도를 🧸순한맛~💀극강까지 조절 가능!",
    link: "/ssum",
    linkText: "썸붕 분석하기 →",
    bg: "from-red-900/20",
  },
  {
    emoji: "🧙",
    title: "Step 5. 연애 상담소",
    desc: "AI 전문 상담사에게\n내 기록 기반 맞춤 상담을 받아요.",
    detail: "하루 3회 무료! 이후 20코인/회\n이전 상담 맥락을 기억해서 이어서 상담 가능.",
    link: "/counsel",
    linkText: "상담 받으러 가기 →",
    bg: "from-emerald-900/20",
  },
  {
    emoji: "👻",
    title: "Step 6. 커뮤니티",
    desc: "다른 유령들과 연애 이야기를 나누고\n영혼의동반자와 서로 조언해요.",
    detail: "💀 동반자를 맺으면 서로 묘비에 코멘트 가능\n👻 커뮤니티에 글 쓰면 +10코인, 댓글 +3코인\n💘 사주 기반 궁합 매칭도 있어요 (30코인)",
    link: "/community",
    linkText: "커뮤니티 가기 →",
    bg: "from-violet-900/20",
  },
  {
    emoji: "🛒",
    title: "Step 7. 상점 & 꾸미기",
    desc: "픽셀아트 아이템으로\n묘비를 예쁘게 꾸며보세요!",
    detail: "코인으로 구매 → 묘비에 장착 → 드래그로 배치\n저주인형, 꽃, 유령 등 다양한 아이템!",
    link: "/shop",
    linkText: "상점 구경하기 →",
    bg: "from-yellow-900/20",
  },
  {
    emoji: "🎉",
    title: "준비 완료!",
    desc: "이제 명예의전당의 모든 기능을\n자유롭게 사용할 수 있어요.",
    detail: "💡 TIP: 먼저 묘비를 세우면 코인도 받고,\nAI 분석도 더 정확해져요!\n\n공지사항에서 튜토리얼을 다시 볼 수 있어요.",
    bg: "from-cemetery-accent/20",
  },
]

export function Tutorial() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!session?.user) return
    if (localStorage.getItem("tutorial-done")) return
    setShow(true)
  }, [session])

  useEffect(() => {
    const handler = () => { setStep(0); setShow(true) }
    window.addEventListener("show-tutorial", handler)
    return () => window.removeEventListener("show-tutorial", handler)
  }, [])

  const handleClose = () => {
    setShow(false)
    localStorage.setItem("tutorial-done", "1")
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

        {/* 상세 설명 박스 */}
        {current.detail && (
          <div className="bg-cemetery-surface/80 rounded-xl p-4">
            <p className="text-xs text-cemetery-text/80 leading-relaxed whitespace-pre-line">
              {current.detail}
            </p>
          </div>
        )}

        {/* 바로가기 */}
        {current.link && (
          <a href={current.link} onClick={handleClose}
            className="block text-center py-2.5 bg-cemetery-accent/20 hover:bg-cemetery-accent/30 border border-cemetery-accent/30 rounded-xl text-sm text-cemetery-accent transition-colors">
            {current.linkText}
          </a>
        )}

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
