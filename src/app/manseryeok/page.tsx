"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
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

const LIFE_QUOTES = [
  "운명은 정해져 있지 않다. 다만 흐름이 있을 뿐이다.",
  "사주는 설계도일 뿐, 건물을 짓는 건 당신이다.",
  "가장 어두운 밤도 결국 새벽을 품고 있다.",
  "지금 겪는 모든 일은 미래의 당신을 만드는 재료다.",
  "별이 빛나려면 어둠이 필요하듯, 시련은 성장의 조건이다.",
  "타이밍이 안 맞는 것은 실패가 아니라 준비 기간이다.",
  "당신의 사주에는 당신만의 빛나는 길이 반드시 있다.",
  "운이 좋은 사람은 자기 운을 믿는 사람이다.",
  "흐르는 물도 결국 바다에 닿듯, 당신도 제자리를 찾을 것이다.",
  "오늘의 선택이 내일의 운명을 만든다.",
  "완벽한 시기는 없다. 시작한 때가 가장 좋은 때다.",
  "사주가 아무리 좋아도 실천하지 않으면 꽃피지 않는다.",
  "인생은 속도가 아니라 방향이다.",
  "지금 힘든 건 다음 스테이지로 가는 로딩 화면이다.",
  "당신이 포기하려는 그 순간이 터닝포인트일 수 있다.",
  "좋은 인연은 준비된 사람에게 온다.",
  "세상에서 가장 정확한 점은 노력이다.",
  "운명은 바꿀 수 없지만 운명을 대하는 태도는 바꿀 수 있다.",
]

interface ChatMsg { role: "user" | "ai"; text: string }

export default function ManseryeokPage() {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id

  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [name, setName] = useState("")
  const [result, setResult] = useState<ManseryeokResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customQuestion, setCustomQuestion] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)

  // 후속 채팅
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatCoins, setChatCoins] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const hourOptions = [
    { value: "", label: "모름 (정오로 계산)" },
    { value: "0", label: "자시" }, { value: "2", label: "축시" },
    { value: "4", label: "인시" }, { value: "6", label: "묘시" },
    { value: "8", label: "진시" }, { value: "10", label: "사시" },
    { value: "12", label: "오시" }, { value: "14", label: "미시" },
    { value: "16", label: "신시" }, { value: "18", label: "유시" },
    { value: "20", label: "술시" }, { value: "22", label: "해시" },
  ]

  // 로딩 중 명언 순환
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setQuoteIdx((p) => (p + 1) % LIFE_QUOTES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // 코인 조회
  useEffect(() => {
    if (!userId) return
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.get" }),
    }).then(r => r.json()).then(d => setChatCoins(d.data?.coins || 0)).catch(() => {})
  }, [userId])

  const handleCalculate = () => {
    if (!birthDate) return
    const [y, m, d] = birthDate.split("-").map(Number)
    const hour = birthTime ? parseInt(birthTime) : 12
    setResult(calculateManseryeok(y, m, d, hour))
    setAnalysis("")
    setChatMessages([])
  }

  const requestAnalysis = async () => {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: result, birthDate,
          name: name || undefined,
          category: selectedCategory || undefined,
          question: customQuestion || undefined,
        }),
      })
      if (!res.ok) { setAnalysis("분석 서버 오류. 다시 시도해주세요."); return }
      const data = await res.json()
      setAnalysis(data.interpretation || "분석 결과를 가져올 수 없습니다.")
    } catch {
      setAnalysis("분석을 가져오는 데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading || !result) return

    const userMsg = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }])
    setChatLoading(true)

    try {
      // 코인 차감
      const spendRes = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "user.spendCoins", amount: 50 }),
      })
      const spendData = await spendRes.json()
      if (spendData.error) {
        setChatMessages((prev) => [...prev, { role: "ai", text: "⚠️ 코인이 부족합니다. (1회 50코인)" }])
        setChatLoading(false)
        return
      }
      setChatCoins(spendData.data?.coins ?? null)

      // 이전 대화 맥락
      const historyText = chatMessages.slice(-6).map((m) =>
        m.role === "user" ? "사용자: " + m.text : "분석가: " + m.text
      ).join("\n")

      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: result, birthDate,
          name: name || undefined,
          question: `[이전 분석 결과 요약]\n${analysis.slice(0, 500)}\n\n${historyText ? "[이전 대화]\n" + historyText + "\n\n" : ""}[추가 질문]\n${userMsg}\n\n위 맥락을 이어서 답변해주세요. 600자 이내로 핵심만.`,
        }),
      })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { role: "ai", text: data.interpretation || "답변을 가져올 수 없습니다." }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "⚠️ 답변 중 오류가 발생했습니다." }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">🔮 종합 운명 분석</h1>
        <p className="text-sm text-cemetery-ghost">
          사주명리 · 자미두수 · 수비학 · 점성학 · 구성기학 · 수리성명학
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
              {hourOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5">
            <h2 className="font-gothic text-lg text-cemetery-heading mb-4">사주팔자</h2>
            <PillarDisplay result={result} />
          </div>

          {/* 분석 주제 */}
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-cemetery-heading">📋 분석 주제 (선택)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ANALYSIS_CATEGORIES.map((cat) => (
                <button key={cat.id} type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                  className={"px-3 py-2.5 rounded-xl text-left transition-all " +
                    (selectedCategory === cat.id
                      ? "bg-cemetery-accent/20 border border-cemetery-accent/40"
                      : "bg-cemetery-surface border border-cemetery-border hover:border-cemetery-ghost/30")}>
                  <p className="text-sm">{cat.label}</p>
                  <p className="text-[10px] text-cemetery-ghost/40">{cat.desc}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">💭 궁금한 점 (자유 입력)</label>
              <textarea value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="예: 올해 연애운이 궁금해요, 이직 시기가 맞을까요?"
                rows={2} maxLength={500}
                className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none focus:border-cemetery-accent focus:outline-none" />
            </div>
            <button type="button" onClick={requestAnalysis} disabled={loading}
              className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
              {loading ? "6가지 학문으로 분석 중..." : "🔮 종합 운명 분석"}
            </button>
          </div>

          {/* 로딩 중 명언 */}
          {loading && (
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 text-center space-y-4">
              <div className="flex justify-center gap-2">
                <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" />
                <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
              <p className="text-xs text-cemetery-ghost/40">별의 흐름을 읽고 있어요...</p>
              <p key={quoteIdx} className="text-sm text-cemetery-heading/80 italic font-gothic leading-relaxed max-w-sm mx-auto animate-fade-in">
                &ldquo;{LIFE_QUOTES[quoteIdx]}&rdquo;
              </p>
            </div>
          )}

          {/* 분석 결과 */}
          {analysis && !loading && (
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

          {/* 후속 채팅 */}
          {analysis && !loading && (
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-cemetery-surface/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-cemetery-heading">💬 추가 질문</h3>
                <span className="text-[10px] text-yellow-400">🪙 1회 50코인 {chatCoins !== null ? `(보유: ${chatCoins})` : ""}</span>
              </div>

              {/* 대화 내역 */}
              {chatMessages.length > 0 && (
                <div className="px-5 py-3 space-y-3 max-h-[400px] overflow-y-auto">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                      {msg.role === "ai" && <span className="text-[10px] text-cemetery-accent">🔮 분석가</span>}
                      <div className={"inline-block px-4 py-2 rounded-2xl max-w-[90%] text-sm " +
                        (msg.role === "user"
                          ? "bg-cemetery-accent text-white rounded-br-sm"
                          : "bg-cemetery-surface text-cemetery-text rounded-bl-sm")}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-1 px-4 py-2">
                      <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* 입력 */}
              <div className="px-5 py-3 border-t border-cemetery-border/30 flex gap-2">
                <input type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat() } }}
                  placeholder="분석 결과에 대해 더 궁금한 점..."
                  disabled={chatLoading}
                  className="flex-1 px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-full text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none disabled:opacity-50" />
                <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-full text-sm transition-colors cute-press">
                  🔮
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
