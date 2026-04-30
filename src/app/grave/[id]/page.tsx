"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import type { Grave } from "@/types"
import { dbGraves } from "@/lib/api-client"
import { PillarDisplay } from "@/components/PillarDisplay"
import { ChatStats } from "@/components/ChatStats"
import { ItemEquipPanel } from "@/components/ItemEquipPanel"
import { dbGraveComment } from "@/lib/partner-client"
import { DraggableItems } from "@/components/DraggableItems"
import { GraveForm } from "@/components/GraveForm"

export default function GraveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [grave, setGrave] = useState<Grave | null>(null)
  const [loading, setLoading] = useState(true)
  const [llmAnalysis, setLlmAnalysis] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)
  const [editing, setEditing] = useState(false)
  const userId = (session?.user as { id?: string })?.id

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    dbGraves.get(userId, id)
      .then((g) => { if (g) setGrave(g as unknown as Grave) })
      .finally(() => setLoading(false))
  }, [id, userId])

  const requestLlmAnalysis = async () => {
    if (!grave) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: grave.manseryeok,
          myManseryeok: grave.myManseryeok,
          compatibility: grave.compatibility,
          chatAnalysis: grave.chatAnalysis,
          nickname: grave.nickname,
          graveReason: grave.graveReason,
        }),
      })
      if (!res.ok) {
        setLlmAnalysis("분석 서버 오류가 발생했습니다. 다시 시도해주세요.")
        return
      }
      const data = await res.json()
      setLlmAnalysis(data.analysis || "분석 결과를 가져올 수 없습니다.")
    } catch {
      setLlmAnalysis("분석 중 오류가 발생했습니다.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleEditSave = async (updated: Grave) => {
    if (!userId) return
    await dbGraves.save(userId, updated as unknown as Record<string, unknown>)
    setGrave(updated)
    setEditing(false)
  }

  if (loading) {
    return <div className="text-center py-20 text-cemetery-ghost/40">로딩 중...</div>
  }

  if (!grave) {
    return (
      <div className="text-center py-20 text-cemetery-ghost">
        묘비를 찾을 수 없습니다...
      </div>
    )
  }

  // 편집 모드
  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-gothic text-2xl text-cemetery-heading">✏️ 묘비 편집</h1>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-cemetery-ghost hover:text-cemetery-heading"
          >
            ✕ 취소
          </button>
        </div>
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6">
          <GraveForm onSave={handleEditSave} initial={grave} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 묘비 헤더 + 드래그 아이템 영역 */}
      <div className="relative bg-cemetery-card border-2 border-cemetery-border/60 rounded-2xl overflow-hidden">
        {/* 편집 버튼 */}
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 right-3 z-30 px-3 py-1.5 text-xs bg-cemetery-surface/80 border border-cemetery-border
            rounded-lg text-cemetery-ghost hover:text-cemetery-heading hover:border-cemetery-accent transition-all"
        >
          ✏️ 편집
        </button>

        {/* 드래그 가능한 아이템 레이어 */}
        <div className="absolute inset-0 z-20">
          <DraggableItems graveId={grave.id} />
        </div>

        {/* 묘비 콘텐츠 */}
        <div className="relative z-10 text-center py-10 pointer-events-none">
          <div className="candle-glow inline-block text-2xl mb-4">🕯️</div>

          {grave.photo ? (
            <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-cemetery-ghost/30 mb-3
              shadow-[0_0_20px_rgba(107,92,231,0.3)]">
              <img src={grave.photo} alt={grave.nickname} className="w-full h-full object-cover grayscale-[30%]" />
            </div>
          ) : (
            <div className="mx-auto w-24 h-24 rounded-full bg-cemetery-surface/50 flex items-center justify-center mb-3 border border-cemetery-border">
              <span className="text-4xl ghost-float">👻</span>
            </div>
          )}

          <h1 className="font-gothic text-4xl font-black text-cemetery-heading">
            {grave.nickname}
          </h1>
          <p className="text-cemetery-ghost mt-2 font-gothic">
            {grave.relationshipStart} — {grave.relationshipEnd}
          </p>
          {grave.epitaph && (
            <p className="text-cemetery-ghost/80 mt-4 italic text-lg max-w-md mx-auto">
              &ldquo;{grave.epitaph}&rdquo;
            </p>
          )}
          <p className="text-cemetery-ghost/50 mt-3 text-sm">
            사인: {grave.causeOfDeath || "미상"}
          </p>
          {grave.graveReason && (
            <p className="text-cemetery-ghost/40 mt-2 text-xs max-w-md mx-auto line-clamp-2">
              📝 {grave.graveReason}
            </p>
          )}
          <p className="text-cemetery-ghost/30 mt-2 text-[10px]">
            아이템을 드래그해서 원하는 곳에 배치하세요
          </p>
        </div>
      </div>

      {/* 아이템 꾸미기 */}
      <ItemEquipPanel graveId={grave.id} />

      {/* 만세력 분석 */}
      {grave.manseryeok && (
        <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
          <h2 className="font-gothic text-xl text-cemetery-heading">
            🔮 상대방 만세력
          </h2>
          <PillarDisplay result={grave.manseryeok} />
        </section>
      )}

      {grave.myManseryeok && (
        <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
          <h2 className="font-gothic text-xl text-cemetery-heading">
            🔮 나의 만세력
          </h2>
          <PillarDisplay result={grave.myManseryeok} />
        </section>
      )}

      {/* 궁합 */}
      {grave.compatibility && (
        <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
          <h2 className="font-gothic text-xl text-cemetery-heading">
            💫 궁합 분석
          </h2>
          <div className="text-center">
            <div className="text-5xl font-bold text-cemetery-accent">
              {grave.compatibility.score}%
            </div>
            <p className="text-cemetery-ghost mt-1">
              {grave.compatibility.elementHarmony}
            </p>
          </div>
          {(grave.compatibility.strengths ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-moss-light mb-2">강점</h3>
              <ul className="space-y-1">
                {(grave.compatibility.strengths ?? []).map((s, i) => (
                  <li key={i} className="text-sm text-cemetery-ghost">✦ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {(grave.compatibility.weaknesses ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-2">약점</h3>
              <ul className="space-y-1">
                {(grave.compatibility.weaknesses ?? []).map((w, i) => (
                  <li key={i} className="text-sm text-cemetery-ghost">⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 카톡 분석 */}
      {grave.chatAnalysis && (
        <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
          <h2 className="font-gothic text-xl text-cemetery-heading">
            💬 카카오톡 분석
          </h2>
          <ChatStats analysis={grave.chatAnalysis} />
        </section>
      )}

      {/* LLM 해설 */}
      <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
        <h2 className="font-gothic text-xl text-cemetery-heading">
          🤖 AI 종합 해설
        </h2>
        {llmAnalysis ? (
          <div className="prose prose-invert max-w-none text-cemetery-ghost text-sm whitespace-pre-wrap leading-relaxed">
            {llmAnalysis}
          </div>
        ) : analyzing ? (
          <AnalyzingQuotes />
        ) : (
          <button
            onClick={requestLlmAnalysis}
            className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim
              rounded-xl transition-colors cute-press"
          >
            AI에게 종합 해설 요청하기
          </button>
        )}
      </section>

      {/* 동반자 코멘트 */}
      <GraveComments graveId={grave.id} />

      {/* 고인과의 대화 */}
      <ChatEntryCard grave={grave} />

      <a
        href="/grave"
        className="inline-block text-cemetery-ghost hover:text-cemetery-heading transition-colors"
      >
        ← 묘지로 돌아가기
      </a>
    </div>
  )
}

const BONE_HITTING_QUOTES = [
  "처음은 실수지만, 두 번째부터는 고의다.",
  "연애를 한다고 외로움이 사라지는 건 아니다.",
  "연락이 없는 건 시간이 없어서가 아니라 마음이 없어서다.",
  "맞춰가는 것도 맞는 부분이 어느 정도는 있어야 한다.",
  "사랑은 노력이 아니라 방향이다. 방향이 다르면 노력해도 멀어진다.",
  "헤어지자는 말은 갑자기 나온 게 아니다. 당신만 몰랐을 뿐.",
  "좋아하는 사람에게는 어떻게든 시간을 만든다.",
  "진심은 행동으로 보이는 거지, 말로 하는 게 아니다.",
  "나를 좋아하는 사람과 내가 좋아하는 사람은 다르다는 걸 배우는 게 연애다.",
  "'변하겠다'는 말을 세 번 이상 했다면, 변할 생각이 없는 거다.",
  "사랑받고 싶으면 먼저 나를 사랑해야 한다. 빈 컵으로는 나눠줄 수 없다.",
  "떠난 사람은 이유가 있어서 떠난 거다. 붙잡는 건 예의가 아니라 집착이다.",
  "연애는 타이밍이다. 아무리 좋은 사람도 시기가 맞지 않으면 독이 된다.",
  "그 사람이 당신의 전부가 되는 순간, 당신은 그 사람의 옵션이 된다.",
  "상처받을까 봐 표현을 안 하는 건, 결국 표현 안 해서 상처받게 된다.",
  "'나 아니면 안 돼'가 아니라 '나 없어도 괜찮아'가 진짜 사랑이다.",
  "좋은 연애는 서로를 변화시키지만, 나쁜 연애는 서로를 소모시킨다.",
  "이별 후에야 보이는 것들이 있다. 그게 성장이다.",
  "그리운 건 그 사람이 아니라, 그 사람과 함께한 '나'다.",
  "연애는 두 사람이 하는 건데, 왜 항상 한 사람만 노력하고 있었을까.",
]

function ChatEntryCard({ grave }: { grave: Grave }) {
  const [showSettings, setShowSettings] = useState(false)
  const [myName, setMyName] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(`chat-myname-${grave.id}`)
    if (saved) setMyName(saved)
  }, [grave.id])

  const handleEnter = () => {
    if (myName.trim()) {
      localStorage.setItem(`chat-myname-${grave.id}`, myName.trim())
    }
    window.location.href = `/grave/${grave.id}/chat`
  }

  return (
    <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full text-center py-4 hover:bg-cemetery-surface/30 transition-colors"
      >
        <span className="text-2xl ghost-float inline-block mb-2">👻</span>
        <p className="text-cemetery-heading font-semibold">
          {grave.nickname}에게 말 걸기
        </p>
        <p className="text-xs text-cemetery-ghost/50 mt-1">
          {grave.chatSamples && grave.chatSamples.length > 0
            ? `${grave.chatSamples.length}개의 기억을 바탕으로 대화합니다`
            : "AI가 가상의 대화를 시뮬레이션합니다"}
        </p>
      </button>

      {showSettings && (
        <div className="border-t border-cemetery-border p-4 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">
              {grave.nickname}에게 어떻게 불릴까요?
            </label>
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="예: 자기, 오빠, 언니, 본명..."
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={handleEnter}
            className="w-full py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl
              transition-colors cute-press text-sm font-semibold"
          >
            👻 대화 시작
          </button>
        </div>
      )}
    </div>
  )
}

function GraveComments({ graveId }: { graveId: string }) {
  const [comments, setComments] = useState<Array<{ id: string; nickname: string; content: string; createdAt: string }>>([])

  useEffect(() => {
    dbGraveComment.list(graveId).then((res) => setComments(res.data || [])).catch(() => {})
  }, [graveId])

  if (comments.length === 0) return null

  return (
    <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-cemetery-heading">💬 동반자들의 코멘트 ({comments.length})</h2>
      {comments.map((c) => (
        <div key={c.id} className="bg-cemetery-surface rounded-xl p-3">
          <span className="text-xs text-cemetery-accent">{c.nickname}</span>
          <span className="text-[9px] text-cemetery-ghost/30 ml-2">
            {new Date(c.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <p className="text-sm text-cemetery-text mt-1">{c.content}</p>
        </div>
      ))}
    </section>
  )
}

function AnalyzingQuotes() {
  const [quoteIdx, setQuoteIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % BONE_HITTING_QUOTES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center py-8 space-y-6">
      <div className="flex justify-center gap-2">
        <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" />
        <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
        <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
      </div>
      <p className="text-cemetery-ghost/40 text-xs">AI가 사주를 분석하고 있어요...</p>
      <div className="max-w-sm mx-auto">
        <p
          key={quoteIdx}
          className="text-cemetery-heading/80 text-sm italic font-gothic leading-relaxed animate-fade-in"
        >
          &ldquo;{BONE_HITTING_QUOTES[quoteIdx]}&rdquo;
        </p>
      </div>
    </div>
  )
}
