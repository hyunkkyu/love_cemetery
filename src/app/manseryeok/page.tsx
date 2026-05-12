"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import type { ManseryeokResult } from "@/types"
import { calculateManseryeok } from "@/lib/manseryeok"
import { PillarDisplay } from "@/components/PillarDisplay"
import { DateInput } from "@/components/DateInput"
import { GenderSelect } from "@/components/GenderSelect"
import { dbSajuProfile } from "@/lib/community-client"

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
  const [gender, setGender] = useState("")
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
  const [chatId, setChatId] = useState<string | null>(null)
  const [savedChats, setSavedChats] = useState<Array<Record<string, unknown>>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [saveAsMyProfile, setSaveAsMyProfile] = useState(false)
  const [myProfileLoaded, setMyProfileLoaded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const hourOptions = [
    { value: "", label: "모름 (정오로 계산)" },
    { value: "0", label: "자시 (23:30~01:30)" }, { value: "2", label: "축시 (01:30~03:30)" },
    { value: "4", label: "인시 (03:30~05:30)" }, { value: "6", label: "묘시 (05:30~07:30)" },
    { value: "8", label: "진시 (07:30~09:30)" }, { value: "10", label: "사시 (09:30~11:30)" },
    { value: "12", label: "오시 (11:30~13:30)" }, { value: "14", label: "미시 (13:30~15:30)" },
    { value: "16", label: "신시 (15:30~17:30)" }, { value: "18", label: "유시 (17:30~19:30)" },
    { value: "20", label: "술시 (19:30~21:30)" }, { value: "22", label: "해시 (21:30~23:30)" },
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

  // 코인 + 저장된 채팅 조회
  useEffect(() => {
    if (!userId) return
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.get" }),
    }).then(r => r.json()).then(d => setChatCoins(d.data?.coins || 0)).catch(() => {})

    loadSavedChats()
  }, [userId])

  // 로그인 후 분석 결과 복원 (회원가입/로그인 후 돌아온 경우)
  useEffect(() => {
    if (!userId) return
    const raw = sessionStorage.getItem("ms-pending")
    if (!raw) return
    sessionStorage.removeItem("ms-pending")
    try {
      const pending = JSON.parse(raw)
      if (pending.birthDate) setBirthDate(pending.birthDate)
      if (pending.birthTime) setBirthTime(pending.birthTime)
      if (pending.gender) setGender(pending.gender)
      if (pending.name) setName(pending.name)
      if (pending.selectedCategory) setSelectedCategory(pending.selectedCategory)
      if (pending.customQuestion) setCustomQuestion(pending.customQuestion)
      if (pending.analysis) setAnalysis(pending.analysis)
      // 사주 재계산
      if (pending.birthDate) {
        const [y, m, d] = pending.birthDate.split("-").map(Number)
        const hour = pending.birthTime ? parseInt(pending.birthTime) : 12
        setResult(calculateManseryeok(y, m, d, hour))
      }
      setMyProfileLoaded(true) // 프로필 자동 로딩 억제
    } catch { /* ignore */ }
  }, [userId])

  // 본인 사주 프로필 자동 불러오기
  useEffect(() => {
    if (!userId || myProfileLoaded) return
    dbSajuProfile.get(userId).then((res) => {
      const p = res?.data?.profile || res?.data
      if (p?.birthDate) {
        setBirthDate(p.birthDate)
        if (p.birthTime) setBirthTime(p.birthTime)
        if (p.gender) setGender(p.gender)
        setName(res?.data?.nickname || "")
        setSaveAsMyProfile(true)
        setMyProfileLoaded(true)
      }
    }).catch(() => {})
  }, [userId, myProfileLoaded])

  const loadSavedChats = async () => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "msChat.list" }),
      })
      const data = await res.json()
      setSavedChats(data.data || [])
    } catch { /* ignore */ }
  }

  const saveChatToDb = async (msgs: ChatMsg[]) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "msChat.save",
          chatId: chatId || undefined,
          birthDate, name,
          analysis: analysis.slice(0, 500),
          messages: msgs,
        }),
      })
      const data = await res.json()
      if (data.data?.id && !chatId) setChatId(data.data.id)
    } catch { /* ignore */ }
  }

  const handleLoadChat = async (saved: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "msChat.get", chatId: saved.id }),
      })
      const data = await res.json()
      if (data.expired) { alert("보관 기간이 만료된 기록입니다."); return }
      if (data.data) {
        const bd = (data.data.birthDate as string) || ""
        const nm = (data.data.name as string) || ""
        setChatMessages((data.data.messages || []) as ChatMsg[])
        setChatId(data.data.id as string)
        setAnalysis(data.data.analysis as string || "")
        setBirthDate(bd)
        setName(nm)
        setShowHistory(false)

        // 사주 재계산 (result가 있어야 분석 결과 + 추가 질문이 표시됨)
        if (bd) {
          const [y, m, d] = bd.split("-").map(Number)
          const hour = birthTime ? parseInt(birthTime) : 12
          setResult(calculateManseryeok(y, m, d, hour))
        }
      }
    } catch { /* ignore */ }
  }

  const handleExtendChat = async (id: string) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "msChat.extend", chatId: id }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setChatCoins(data.data?.coins ?? null)
      loadSavedChats()
      alert("영구 보관 완료!")
    } catch { alert("오류가 발생했습니다") }
  }

  // 비로그인 시 분석 결과를 sessionStorage에 저장 (회원가입 후 복원용)
  const savePendingAnalysis = () => {
    try {
      sessionStorage.setItem("ms-pending", JSON.stringify({
        birthDate, birthTime, gender, name,
        selectedCategory, customQuestion, analysis,
      }))
    } catch { /* ignore */ }
  }

  // 기존 채팅이 있으면 저장 후 리셋
  const saveAndResetChat = async () => {
    if (chatMessages.length > 0 && analysis) {
      await saveChatToDb(chatMessages)
      loadSavedChats()
    }
    setChatMessages([])
    setChatId(null)
  }

  const handleCalculate = async () => {
    if (!birthDate) return
    await saveAndResetChat()
    const [y, m, d] = birthDate.split("-").map(Number)
    const hour = birthTime ? parseInt(birthTime) : 12
    const calcResult = calculateManseryeok(y, m, d, hour)
    setResult(calcResult)
    setAnalysis("")

    if (saveAsMyProfile && userId) {
      const yearBranch = calcResult.fourPillars.year.branch
      const ilju = `${calcResult.fourPillars.day.stem}${calcResult.fourPillars.day.branch}`
      try {
        await dbSajuProfile.register(userId, session?.user?.name || name || "익명", {
          birthDate, birthTime, gender, ilju, yearBranch,
          dominantElement: calcResult.dominantElement,
          elementBalance: calcResult.elementBalance,
          isPublic: true,
        })
      } catch { /* ignore save failure */ }
    }
  }

  const requestAnalysis = async () => {
    if (!result) return
    await saveAndResetChat()
    setLoading(true)
    try {
      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: result, birthDate, gender,
          name: name || undefined,
          category: selectedCategory || undefined,
          question: customQuestion || undefined,
        }),
      })
      if (res.status === 401) { setAnalysis("⚠️ 로그인이 필요한 기능입니다. 로그인 후 다시 시도해주세요."); return }
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
      // 첫 1회 무료, 이후 50코인
      const isFirstChat = chatMessages.length === 0
      if (!isFirstChat) {
        const spendRes = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "user.spendCoins", amount: 50 }),
        })
        const spendData = await spendRes.json()
        if (spendData.error) {
          setChatMessages((prev) => [...prev, { role: "ai", text: "⚠️ 코인이 부족합니다. (1회 50코인, 첫 질문은 무료!)" }])
          setChatLoading(false)
          return
        }
        setChatCoins(spendData.data?.coins ?? null)
      }

      // 이전 대화 맥락
      const historyText = chatMessages.slice(-6).map((m) =>
        m.role === "user" ? "사용자: " + m.text : "분석가: " + m.text
      ).join("\n")

      const res = await fetch("/api/manseryeok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: result, birthDate, gender,
          name: name || undefined,
          question: `[이전 분석 결과 요약]\n${analysis.slice(0, 500)}\n\n${historyText ? "[이전 대화]\n" + historyText + "\n\n" : ""}[추가 질문]\n${userMsg}\n\n위 맥락을 이어서 답변해주세요. 600자 이내로 핵심만.`,
        }),
      })
      const data = await res.json()
      const newMsgs: ChatMsg[] = [...chatMessages, { role: "user", text: userMsg }, { role: "ai", text: data.interpretation || "답변을 가져올 수 없습니다." }]
      setChatMessages(newMsgs)
      // 자동 저장
      saveChatToDb(newMsgs)
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
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">성별 *</label>
          <GenderSelect value={gender} onChange={setGender} />
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
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={saveAsMyProfile} onChange={(e) => setSaveAsMyProfile(e.target.checked)} disabled={!userId}
              className="accent-cemetery-accent w-4 h-4 rounded" />
            <span className="text-xs text-cemetery-ghost">본인 사주로 저장 (궁합 매칭에 사용)</span>
          </label>
          {myProfileLoaded && <p className="text-xs text-green-400/60">✓ 기존 본인 사주 정보를 불러왔습니다</p>}
          {!userId && <p className="text-xs text-cemetery-ghost/30">로그인하면 본인 사주를 저장할 수 있어요</p>}
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
            <div className="relative">
              <AnalysisResult analysis={analysis} onReanalyze={() => { setAnalysis(""); requestAnalysis() }} />
              {/* 비로그인: 60%까지 보이고 블러 + 가입 유도 */}
              {!userId && (
                <div className="absolute inset-0 top-[60%] flex flex-col items-center justify-end pb-8 rounded-b-2xl"
                  style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(10,10,18,0.97) 50%)" }}>
                  <div className="text-center space-y-3 px-4">
                    <p className="text-cemetery-heading font-bold text-sm">전체 결과 + 추가 질문은 회원만!</p>
                    <p className="text-cemetery-ghost/50 text-xs">가입하면 500코인 + 무제한 분석</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <a href="/register?callbackUrl=/manseryeok"
                        onClick={() => savePendingAnalysis()}
                        className="px-6 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors">
                        회원가입하고 전체 보기
                      </a>
                      <a href="/login?callbackUrl=/manseryeok"
                        onClick={() => savePendingAnalysis()}
                        className="px-6 py-2.5 bg-cemetery-surface border border-cemetery-border hover:border-cemetery-accent rounded-xl text-xs text-cemetery-ghost transition-colors">
                        이미 계정이 있어요
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 후속 채팅 (로그인 유저만) */}
          {analysis && !loading && userId && (
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-cemetery-surface/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-cemetery-heading">💬 추가 질문</h3>
                <span className="text-[10px] text-yellow-400">
                  {chatMessages.length === 0 ? "✨ 첫 질문 무료!" : "🪙 50코인/회"} {chatCoins !== null ? `(보유: ${chatCoins})` : ""}
                </span>
              </div>

              {/* 대화 내역 */}
              {chatMessages.length > 0 && (
                <div className="px-5 py-3 space-y-3">
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

      {/* 저장된 분석 기록 (사주 계산 전에도 표시) */}
      {savedChats.length > 0 && (
        <>
          <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadSavedChats() }}
            className="w-full py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-sm text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            📋 분석 기록 ({savedChats.length}건) {showHistory ? "▲" : "▼"}
          </button>

          {showHistory && (
            <div className="space-y-2 animate-fade-in">
              {savedChats.map((chat) => {
                const daysLeft = chat.daysLeft as number
                const isExpiring = chat.isExpiring as boolean
                const isPerm = daysLeft === -1
                return (
                  <div key={chat.id as string}
                    className={"bg-cemetery-card border rounded-2xl p-4 " +
                      (isExpiring ? "border-red-500/30" : "border-cemetery-border")}>
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => handleLoadChat(chat)}
                        className="text-left flex-1">
                        <p className="text-sm text-cemetery-heading">
                          {(chat.name as string) || "이름 미입력"} · {chat.birthDate as string}
                        </p>
                        <p className="text-[10px] text-cemetery-ghost/40">
                          {((chat.messages as unknown[]) || []).length}개 대화 · {new Date(chat.createdAt as string).toLocaleDateString("ko-KR")}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        {isPerm ? (
                          <span className="text-[10px] text-green-400">♾️ 영구</span>
                        ) : (
                          <span className={"text-[10px] " + (isExpiring ? "text-red-400" : "text-cemetery-ghost/40")}>
                            {daysLeft}일 남음
                          </span>
                        )}
                      </div>
                    </div>
                    {!isPerm && (
                      <div className="flex gap-2">
                        <button onClick={() => handleExtendChat(chat.id as string)}
                          className={"flex-1 py-1.5 rounded-lg text-xs transition-colors cute-press " +
                            (isExpiring
                              ? "bg-red-500/20 border border-red-500/30 text-red-300"
                              : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-accent")}>
                          🪙 10코인으로 영구 보관
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** 분석 결과를 섹션별로 분리하여 접기/펼치기 가능하게 */
function AnalysisResult({ analysis, onReanalyze }: { analysis: string; onReanalyze: () => void }) {
  const [collapsed, setCollapsed] = useState(false)

  // 분석 텍스트를 **소제목** 기준으로 섹션 분리
  const sections = parseSections(analysis)
  const hasMultiple = sections.length > 1

  // 기본값: "교차검증 종합 결론" 섹션만 펼침
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    const conclusionIdx = sections.findIndex((s) =>
      s.title.includes("교차검증") || s.title.includes("종합 결론") || s.title.includes("종합")
    )
    return new Set(conclusionIdx >= 0 ? [conclusionIdx] : sections.length > 0 ? [sections.length - 1] : [])
  })

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const expandAll = () => setExpandedSections(new Set(sections.map((_, i) => i)))
  const collapseAll = () => setExpandedSections(new Set())

  return (
    <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-3 bg-cemetery-surface/50 flex items-center justify-between">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-cemetery-heading">🔮 종합 분석 결과</h2>
          <span className="text-[10px] text-cemetery-ghost/40">{collapsed ? "▼" : "▲"}</span>
        </button>
        <div className="flex items-center gap-2">
          {hasMultiple && !collapsed && (
            <button onClick={expandedSections.size === sections.length ? collapseAll : expandAll}
              className="text-[10px] text-cemetery-ghost/40 hover:text-cemetery-accent">
              {expandedSections.size === sections.length ? "모두 접기" : "모두 펼치기"}
            </button>
          )}
          <button onClick={onReanalyze}
            className="text-[10px] text-cemetery-ghost/40 hover:text-cemetery-accent transition-colors">
            🔄 재분석
          </button>
        </div>
      </div>

      {/* 본문 */}
      {!collapsed && (
        <div className="px-5 py-3">
          {hasMultiple ? (
            // 섹션별 아코디언
            <div className="space-y-2">
              {sections.map((section, i) => {
                const isOpen = expandedSections.has(i)
                return (
                  <div key={i} className="border border-cemetery-border/30 rounded-xl overflow-hidden">
                    <button onClick={() => toggleSection(i)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left bg-cemetery-surface/30 hover:bg-cemetery-surface/50 transition-colors gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-cemetery-heading">{section.title}</span>
                        {!isOpen && (
                          <span className="block text-xs text-cemetery-ghost/30 truncate mt-0.5">
                            {section.content.replace(/\n/g, " ").slice(0, 50)}...
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-cemetery-ghost/40 flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 text-sm text-cemetery-text whitespace-pre-wrap leading-relaxed animate-fade-in">
                        {section.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // 섹션이 1개면 그냥 표시
            <div className="text-sm text-cemetery-text whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** **소제목** 패턴으로 텍스트를 섹션으로 분리 */
function parseSections(text: string): Array<{ title: string; content: string }> {
  // **제목** 또는 ## 제목 또는 이모지+제목 패턴
  const lines = text.split("\n")
  const sections: Array<{ title: string; content: string }> = []
  let currentTitle = ""
  let currentContent: string[] = []

  for (const line of lines) {
    // 소제목 감지: **텍스트**, ## 텍스트, 이모지 + 텍스트 (줄 전체가 짧고 볼드)
    const boldMatch = line.match(/^\*\*(.+?)\*\*\s*$/)
    const hashMatch = line.match(/^#{1,3}\s+(.+)$/)
    const emojiTitleMatch = line.match(/^[🔮💫🪔🕯️✨💘🔥⚡🌳💧⛰️⚔️🧠💼🏥📅👨‍👩‍👧🐾🎨💪🔍💡🪞✝️☯️⭐🌙]\s*.{3,30}$/)

    const isTitle = boldMatch || hashMatch || emojiTitleMatch

    if (isTitle && line.trim().length < 50) {
      // 이전 섹션 저장
      if (currentTitle || currentContent.length > 0) {
        sections.push({
          title: currentTitle || "분석 결과",
          content: currentContent.join("\n").trim(),
        })
      }
      currentTitle = (boldMatch?.[1] || hashMatch?.[1] || line).trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  // 마지막 섹션
  if (currentTitle || currentContent.length > 0) {
    sections.push({
      title: currentTitle || "분석 결과",
      content: currentContent.join("\n").trim(),
    })
  }

  return sections.filter((s) => s.content.trim().length > 0)
}
