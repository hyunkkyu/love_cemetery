"use client"

import { useState } from "react"
import type { ManseryeokResult } from "@/types"
import { calculateManseryeok } from "@/lib/manseryeok"
import { PillarDisplay } from "@/components/PillarDisplay"
import { DateInput } from "@/components/DateInput"

export default function ManseryeokPage() {
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [result, setResult] = useState<ManseryeokResult | null>(null)
  const [llmInterpretation, setLlmInterpretation] = useState("")
  const [loading, setLoading] = useState(false)

  const hourOptions = [
    { value: "", label: "모름 (정오로 계산)" },
    { value: "0", label: "자시 (23:30~01:30)" },
    { value: "2", label: "축시 (01:30~03:30)" },
    { value: "4", label: "인시 (03:30~05:30)" },
    { value: "6", label: "묘시 (05:30~07:30)" },
    { value: "8", label: "진시 (07:30~09:30)" },
    { value: "10", label: "사시 (09:30~11:30)" },
    { value: "12", label: "오시 (11:30~13:30)" },
    { value: "14", label: "미시 (13:30~15:30)" },
    { value: "16", label: "신시 (15:30~17:30)" },
    { value: "18", label: "유시 (17:30~19:30)" },
    { value: "20", label: "술시 (19:30~21:30)" },
    { value: "22", label: "해시 (21:30~23:30)" },
  ]

  const handleCalculate = () => {
    if (!birthDate) return
    const [y, m, d] = birthDate.split("-").map(Number)
    const hour = birthTime ? parseInt(birthTime) : 12
    setResult(calculateManseryeok(y, m, d, hour))
    setLlmInterpretation("")
  }

  const requestInterpretation = async () => {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manseryeok: result }),
      })
      const data = await res.json()
      setLlmInterpretation(data.interpretation)
    } catch {
      setLlmInterpretation("해설을 가져오는 데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
        🔮 만세력 계산기
      </h1>
      <p className="text-cemetery-ghost">
        생년월일과 태어난 시간을 입력하면 사주팔자를 계산합니다.
      </p>

      {/* 입력 폼 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">생년월일 *</label>
            <DateInput
              value={birthDate}
              onChange={setBirthDate}
              placeholder="생년월일 선택"
            />
          </div>
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">태어난 시간</label>
            <select
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text focus:border-cemetery-accent focus:outline-none"
            >
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleCalculate}
          disabled={!birthDate}
          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
            rounded-lg font-semibold transition-colors"
        >
          만세력 계산하기
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-xl p-6 space-y-6">
          <h2 className="font-gothic text-xl text-cemetery-heading">사주팔자</h2>
          <PillarDisplay result={result} />

          {/* AI 해설 */}
          {llmInterpretation ? (
            <div className="bg-cemetery-surface rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cemetery-heading mb-2">🤖 AI 해설</h3>
              <p className="text-sm text-cemetery-ghost whitespace-pre-wrap">
                {llmInterpretation}
              </p>
            </div>
          ) : (
            <button
              onClick={requestInterpretation}
              disabled={loading}
              className="w-full py-3 bg-cemetery-surface border border-cemetery-border
                hover:border-cemetery-accent rounded-lg transition-colors"
            >
              {loading ? "AI가 해석 중..." : "🤖 AI에게 상세 해설 요청"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
