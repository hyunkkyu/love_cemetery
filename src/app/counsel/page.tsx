"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CounselRecord {
  id: string
  question: string
  answer: string
  coinUsed: number
  createdAt: string
}

interface CounselStatus {
  freeRemaining: number
  freeLimit: number
  coinCost: number
  coins: number
  totalCounsels: number
}

async function callCounsel(action: string, payload: Record<string, unknown> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch("/api/counsel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    })
    const json = await res.json()
    if (!res.ok || json.error) throw new Error(json.error || "API 오류")
    return json
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("응답 시간 초과")
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export default function CounselPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [counselStatus, setCounselStatus] = useState<CounselStatus | null>(null)
  const [history, setHistory] = useState<CounselRecord[]>([])
  const [question, setQuestion] = useState("")
  const [asking, setAsking] = useState(false)
  const [latestAnswer, setLatestAnswer] = useState("")
  const [error, setError] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login")
    if (userId) reload()
  }, [userId, authStatus, router])

  const reload = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        callCounsel("counsel.status"),
        callCounsel("counsel.history"),
      ])
      setCounselStatus(statusRes.data)
      setHistory(historyRes.data || [])
    } catch { /* ignore */ }
  }

  const handleAsk = async () => {
    if (!question.trim() || asking) return
    setAsking(true)
    setError("")
    setLatestAnswer("")
    try {
      const res = await callCounsel("counsel.ask", { question: question.trim() })
      setLatestAnswer(res.data.answer)
      setQuestion("")
      reload()
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "상담 중 오류가 발생했습니다")
    } finally {
      setAsking(false)
    }
  }

  if (authStatus === "loading") return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-3">
        <div className="text-5xl ghost-float inline-block">🧙</div>
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">연애 상담소</h1>
        <p className="text-xs text-cemetery-ghost/40">
          당신의 묘비와 사주를 바탕으로 전문 상담사가 조언해드려요
        </p>
      </div>

      {/* 상태 카드 */}
      {counselStatus && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-cemetery-ghost/40">오늘 무료</p>
            <p className="text-lg font-bold text-green-400">
              {counselStatus.freeRemaining}/{counselStatus.freeLimit}
            </p>
          </div>
          <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-cemetery-ghost/40">추가 시</p>
            <p className="text-lg font-bold text-yellow-400">🪙 {counselStatus.coinCost}</p>
          </div>
          <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-cemetery-ghost/40">보유 코인</p>
            <p className="text-lg font-bold text-cemetery-heading">🪙 {counselStatus.coins}</p>
          </div>
        </div>
      )}

      {/* 질문 입력 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-cemetery-heading">💭 무엇이 궁금하세요?</h2>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
          placeholder={"연애 고민, 사주 해석, 이별 극복, 새 연애 시작 등...\n과거 연애 기록과 사주를 참고해서 맞춤 상담해드려요."}
          rows={4}
          maxLength={1000}
          disabled={asking}
          className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl
            text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none
            focus:border-cemetery-accent focus:outline-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-cemetery-ghost/30">
            {counselStatus && counselStatus.freeRemaining > 0
              ? "무료 상담 " + counselStatus.freeRemaining + "회 남음"
              : "🪙 " + (counselStatus?.coinCost || 20) + "코인 차감"}
          </p>
          <button
            onClick={handleAsk}
            disabled={asking || question.trim().length < 5}
            className="px-6 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40
              rounded-xl text-sm font-semibold transition-colors cute-press"
          >
            {asking ? "상담 중..." : "🧙 상담 받기"}
          </button>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* 로딩 */}
      {asking && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 text-center space-y-3 animate-fade-in">
          <div className="text-3xl ghost-float inline-block">🧙</div>
          <p className="text-sm text-cemetery-ghost/50 animate-pulse">
            상담사가 당신의 기록을 살펴보고 있어요...
          </p>
          <p className="text-xs text-cemetery-ghost/30 italic">
            과거 연애, 사주, 이전 상담 내용을 모두 참고합니다
          </p>
        </div>
      )}

      {/* 최신 답변 */}
      {latestAnswer && (
        <div ref={answerRef} className="bg-cemetery-card border border-cemetery-accent/30 rounded-2xl p-6 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧙</span>
            <h3 className="text-sm font-semibold text-cemetery-accent">상담사의 답변</h3>
          </div>
          <div className="text-sm text-cemetery-text leading-relaxed whitespace-pre-wrap">
            {latestAnswer}
          </div>
        </div>
      )}

      {/* 상담 이력 */}
      {history.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-3 bg-cemetery-card border border-cemetery-border rounded-2xl
              text-sm text-cemetery-ghost hover:text-cemetery-heading transition-colors"
          >
            📋 상담 이력 ({history.length}건) {showHistory ? "▲" : "▼"}
          </button>

          {showHistory && (
            <div className="space-y-3 animate-fade-in">
              {history.map((h) => (
                <div key={h.id} className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 bg-cemetery-surface/50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-cemetery-heading">{h.question}</p>
                      <div className="flex items-center gap-2">
                        {h.coinUsed > 0 && (
                          <span className="text-[10px] text-yellow-400">🪙 {h.coinUsed}</span>
                        )}
                        <span className="text-[10px] text-cemetery-ghost/30">
                          {new Date(h.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-xs text-cemetery-ghost/70 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {h.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
