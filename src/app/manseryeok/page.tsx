"use client"

import { useState } from "react"
import type { ManseryeokResult } from "@/types"
import { calculateManseryeok } from "@/lib/manseryeok"
import { PillarDisplay } from "@/components/PillarDisplay"
import { DateInput } from "@/components/DateInput"

const ANALYSIS_CATEGORIES = [
  { id: "love", label: "💘 연애/결혼운", desc: "연애 성향, 이상형, 결혼 시기" },
  { id: "career", label: "💼 직업/재물운", desc: "적성, 재물 흐름, 사업운" },
  { id: "health", label: "🏥 건강운", desc: "체질, 주의할 건강 이슈" },
  { id: "personality", label: "🧠 성격/심층 분석", desc: "내면 성격, 무의식 패턴" },
  { id: "timing", label: "📅 시기/대운", desc: "올해 운세, 전환기, 주의 시기" },
  { id: "relation", label: "👨‍👩‍👧 대인관계", desc: "인간관계 패턴, 궁합 유형" },
]

export default function ManseryeokPage() {
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [name, setName] = useState("")
  const [result, setResult] = useState<ManseryeokResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [customQuestion, setCustomQuestion] = useState("")
  const [analysis, setAnalysis] = useState("")
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
    setAnalysis("")
  }

  const requestAnalysis = async () => {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: result,
          birthDate,
          name: name || undefined,
          category: selectedCategory || undefined,
          question: customQuestion || undefined,
        }),
      })
      if (!res.ok) {
        setAnalysis("분석 서버 오류가 발생했습니다. 다시 시도해주세요.")
        return
      }
      const data = await res.json()
      setAnalysis(data.interpretation || "분석 결과를 가져올 수 없습니다.")
    } catch {
      setAnalysis("분석을 가져오는 데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">🔮 종합 운명 분석</h1>
        <p className="text-sm text-cemetery-ghost">
          사주명리 · 자미두수 · 수비학 · 점성학 · 구성기학 · 수리성명학<br />
          <span className="text-cemetery-ghost/50">6가지 학문을 교차검증한 종합 분석</span>
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4"
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>

        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">이름 (선택)</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="수리성명학 분석에 사용됩니다"
            className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">생년월일 *</label>
            <DateInput value={birthDate} onChange={setBirthDate} />
          </div>
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">태어난 시간</label>
            <select value={birthTime} onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text text-sm focus:border-cemetery-accent focus:outline-none">
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" onClick={handleCalculate} disabled={!birthDate}
          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
          🔮 사주 계산
        </button>
      </div>

      {/* 사주 결과 */}
      {result && (
        <>
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
            <h2 className="font-gothic text-lg text-cemetery-heading">사주팔자</h2>
            <PillarDisplay result={result} />
          </div>

          {/* 분석 주제 선택 */}
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-cemetery-heading">📋 분석 주제 선택 (선택사항)</h2>
            <p className="text-[10px] text-cemetery-ghost/40">선택 안 하면 전체 종합 분석을 제공합니다</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ANALYSIS_CATEGORIES.map((cat) => (
                <button key={cat.id} type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                  className={"px-3 py-2.5 rounded-xl text-left transition-all " +
                    (selectedCategory === cat.id
                      ? "bg-cemetery-accent/20 border border-cemetery-accent/40 ring-1 ring-cemetery-accent/20"
                      : "bg-cemetery-surface border border-cemetery-border hover:border-cemetery-ghost/30")}>
                  <p className="text-sm">{cat.label}</p>
                  <p className="text-[10px] text-cemetery-ghost/40">{cat.desc}</p>
                </button>
              ))}
            </div>

            {/* 자유 질문 */}
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">💭 궁금한 점 (자유 입력)</label>
              <textarea value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="예: 올해 연애운이 궁금해요, 이직을 고민 중인데 시기가 맞을까요?, 나와 잘 맞는 유형은?"
                rows={3} maxLength={500}
                className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none focus:border-cemetery-accent focus:outline-none" />
            </div>

            <button type="button" onClick={requestAnalysis} disabled={loading}
              className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
              {loading ? "6가지 학문으로 분석 중..." : "🔮 종합 운명 분석 요청"}
            </button>
          </div>

          {/* 분석 결과 */}
          {analysis && (
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cemetery-heading">🔮 종합 분석 결과</h2>
                <button onClick={() => { setAnalysis(""); requestAnalysis() }}
                  className="text-[10px] text-cemetery-ghost/40 hover:text-cemetery-accent transition-colors">
                  🔄 재분석
                </button>
              </div>
              <div className="text-sm text-cemetery-text whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
