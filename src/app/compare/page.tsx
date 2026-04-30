"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Grave } from "@/types"
import { dbGraves } from "@/lib/api-client"
import { GraveCard } from "@/components/GraveCard"
import { PillarDisplay } from "@/components/PillarDisplay"
import { ChatStats } from "@/components/ChatStats"

export default function ComparePage() {
  const { data: session } = useSession()
  const [graves, setGraves] = useState<Grave[]>([])
  const [selectedA, setSelectedA] = useState<Grave | null>(null)
  const [selectedB, setSelectedB] = useState<Grave | null>(null)
  const [llmVerdict, setLlmVerdict] = useState("")
  const [loading, setLoading] = useState(false)
  const userId = (session?.user as { id?: string })?.id

  useEffect(() => {
    if (userId) dbGraves.list(userId).then((d) => setGraves(d || []))
  }, [userId])

  const requestComparison = async () => {
    if (!selectedA || !selectedB) return
    setLoading(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "compare",
          graveA: {
            nickname: selectedA.nickname,
            manseryeok: selectedA.manseryeok,
            compatibility: selectedA.compatibility,
            chatAnalysis: selectedA.chatAnalysis,
          },
          graveB: {
            nickname: selectedB.nickname,
            manseryeok: selectedB.manseryeok,
            compatibility: selectedB.compatibility,
            chatAnalysis: selectedB.chatAnalysis,
          },
        }),
      })
      const data = await res.json()
      setLlmVerdict(data.analysis)
    } catch {
      setLlmVerdict("비교 분석 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (graves.length < 2) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-5xl opacity-30">⚖️</div>
        <h1 className="font-gothic text-2xl text-cemetery-heading">비교 분석</h1>
        <p className="text-cemetery-ghost">
          비교하려면 최소 2개의 묘비가 필요합니다.
        </p>
        <a
          href="/grave"
          className="inline-block mt-4 px-6 py-2 bg-cemetery-accent rounded-lg"
        >
          묘비 세우러 가기
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
        ⚖️ 비교 분석
      </h1>
      <p className="text-cemetery-ghost">
        두 묘비를 선택하여 만세력과 카톡 패턴을 비교합니다.
      </p>

      {/* 선택 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm text-cemetery-ghost">첫 번째 선택</h3>
          <div className="grid gap-3">
            {graves.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedA(g)}
                className="cursor-pointer"
              >
                <GraveCard
                  grave={g}
                  onSelect={setSelectedA}
                  selected={selectedA?.id === g.id}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm text-cemetery-ghost">두 번째 선택</h3>
          <div className="grid gap-3">
            {graves.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedB(g)}
                className="cursor-pointer"
              >
                <GraveCard
                  grave={g}
                  onSelect={setSelectedB}
                  selected={selectedB?.id === g.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 비교 결과 */}
      {selectedA && selectedB && selectedA.id !== selectedB.id && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <span className="text-2xl font-gothic text-cemetery-heading">
              {selectedA.nickname}
            </span>
            <span className="mx-4 text-cemetery-ghost text-xl">VS</span>
            <span className="text-2xl font-gothic text-cemetery-heading">
              {selectedB.nickname}
            </span>
          </div>

          {/* 궁합 점수 비교 */}
          {selectedA.compatibility && selectedB.compatibility && (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6 text-center">
                <p className="text-sm text-cemetery-ghost mb-2">{selectedA.nickname} 궁합</p>
                <p className="text-4xl font-bold text-cemetery-accent">
                  {selectedA.compatibility.score}%
                </p>
              </div>
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6 text-center">
                <p className="text-sm text-cemetery-ghost mb-2">{selectedB.nickname} 궁합</p>
                <p className="text-4xl font-bold text-cemetery-accent">
                  {selectedB.compatibility.score}%
                </p>
              </div>
            </div>
          )}

          {/* 만세력 비교 */}
          {selectedA.manseryeok && selectedB.manseryeok && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6">
                <h3 className="text-sm text-cemetery-ghost mb-4">{selectedA.nickname} 만세력</h3>
                <PillarDisplay result={selectedA.manseryeok} />
              </div>
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6">
                <h3 className="text-sm text-cemetery-ghost mb-4">{selectedB.nickname} 만세력</h3>
                <PillarDisplay result={selectedB.manseryeok} />
              </div>
            </div>
          )}

          {/* 카톡 분석 비교 */}
          {selectedA.chatAnalysis && selectedB.chatAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6">
                <h3 className="text-sm text-cemetery-ghost mb-4">{selectedA.nickname} 카톡</h3>
                <ChatStats analysis={selectedA.chatAnalysis} />
              </div>
              <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6">
                <h3 className="text-sm text-cemetery-ghost mb-4">{selectedB.nickname} 카톡</h3>
                <ChatStats analysis={selectedB.chatAnalysis} />
              </div>
            </div>
          )}

          {/* AI 종합 비교 */}
          <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6">
            <h3 className="font-gothic text-xl text-cemetery-heading mb-4">
              🤖 AI 비교 분석
            </h3>
            {llmVerdict ? (
              <p className="text-sm text-cemetery-ghost whitespace-pre-wrap">
                {llmVerdict}
              </p>
            ) : (
              <button
                onClick={requestComparison}
                disabled={loading}
                className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
                  rounded-lg transition-colors"
              >
                {loading ? "AI 비교 중..." : "AI에게 비교 분석 요청"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
