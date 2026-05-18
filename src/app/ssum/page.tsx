"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbSsum } from "@/lib/ssum-client"
import { calculateManseryeok, calculateCompatibility } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"
import { GenderSelect } from "@/components/GenderSelect"
import { ChatStats } from "@/components/ChatStats"
import { parseKakaoFile, analyzeChat } from "@/lib/kakao-parser"
import type { ChatAnalysis } from "@/types"

const SSUM_QUOTES = [
  "좋아하는 감정은 틀린 게 아니다. 타이밍이 안 맞았을 뿐.",
  "거절은 당신의 가치와 무관하다. 그냥 퍼즐 조각이 안 맞는 거다.",
  "썸이 안 됐다고 실패가 아니다. 안 맞는 사람을 빨리 알게 된 거다.",
  "상대가 날 안 좋아하는 건 내 잘못이 아니다. 취향의 문제다.",
  "집착은 사랑이 아니다. 놓아줄 줄 아는 게 진짜 사랑이다.",
  "한 사람에게 거절당한 건 70억 중 1명이 아닌 것일 뿐.",
  "감정을 숨기느라 에너지를 쓰지 마라. 표현했는데 안 되면 그게 답이다.",
  "매력은 외모가 아니라 자신감에서 나온다.",
  "너무 좋아하면 약점이 된다. 적당한 거리가 매력이다.",
  "안 되는 썸에 매달리는 시간에 나를 가꾸면 더 좋은 사람이 온다.",
  "상대의 행동이 답이다. 말은 거짓말을 해도 행동은 못 한다.",
  "밀당은 기술이 아니라, 진심이 없다는 증거다.",
  "좋아하는 사람에게는 시간을 만든다. 바쁘다는 건 핑계다.",
  "이별의 아픔은 새 만남의 설렘으로 치유된다.",
  "혼자 있는 게 잘못된 사람과 있는 것보다 백배 낫다.",
]

interface SsumRecord {
  id: string; nickname: string; photo?: string; duration: string; howWeMet: string
  myOpinion: string; signals: string[]; lastMessage: string; persona: string
  compatibility?: { score: number; elementHarmony: string }
  chatAnalysis?: ChatAnalysis
  aiAnalysis?: string; createdAt: string
}

// 삭제: 기존 고정 선택지 → 주관식으로 변경

export default function SsumPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [list, setList] = useState<SsumRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SsumRecord | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // 폼 상태
  const [form, setForm] = useState({
    nickname: "", birthDate: "", birthTime: "", myBirthDate: "", myBirthTime: "",
    duration: "", howWeMet: "", myOpinion: "", lastMessage: "", persona: "",
  })
  const [signals, setSignals] = useState<string[]>([])
  const [signalInput, setSignalInput] = useState("")
  const [factLevel, setFactLevel] = useState(3)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [chatFile, setChatFile] = useState<File | null>(null)

  const hourOptions = [
    { value: "", label: "모름" }, { value: "0", label: "자시 (23:30~01:30)" }, { value: "2", label: "축시 (01:30~03:30)" },
    { value: "4", label: "인시 (03:30~05:30)" }, { value: "6", label: "묘시 (05:30~07:30)" }, { value: "8", label: "진시 (07:30~09:30)" },
    { value: "10", label: "사시 (09:30~11:30)" }, { value: "12", label: "오시 (11:30~13:30)" }, { value: "14", label: "미시 (13:30~15:30)" },
    { value: "16", label: "신시 (15:30~17:30)" }, { value: "18", label: "유시 (17:30~19:30)" }, { value: "20", label: "술시 (19:30~21:30)" },
    { value: "22", label: "해시 (21:30~23:30)" },
  ]

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) reload()
  }, [userId, status, router])

  useEffect(() => {
    if (!analyzing) return
    const interval = setInterval(() => setQuoteIdx((p) => (p + 1) % SSUM_QUOTES.length), 3500)
    return () => clearInterval(interval)
  }, [analyzing])

  const reload = async () => {
    try { const res = await dbSsum.list(); setList(res.data || []) } catch { /* */ }
  }

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const addSignal = () => {
    const text = signalInput.trim()
    if (!text || signals.includes(text)) return
    setSignals((prev) => [...prev, text])
    setSignalInput("")
  }

  const removeSignal = (s: string) => {
    setSignals((prev) => prev.filter((x) => x !== s))
  }

  const handleSave = async () => {
    if (!form.nickname || saving) return
    setSaving(true)
    try {
      // 카톡 파일 분석
      let chatAnalysis: ChatAnalysis | undefined
      if (chatFile) {
        const text = await chatFile.text()
        const messages = parseKakaoFile(text, chatFile.name)
        if (messages.length > 0) chatAnalysis = analyzeChat(messages)
      }

      let manseryeok, myManseryeok, compatibility
      if (form.birthDate) {
        const [y, m, d] = form.birthDate.split("-").map(Number)
        manseryeok = calculateManseryeok(y, m, d, form.birthTime ? parseInt(form.birthTime) : 12)
      }
      if (form.myBirthDate) {
        const [y, m, d] = form.myBirthDate.split("-").map(Number)
        myManseryeok = calculateManseryeok(y, m, d, form.myBirthTime ? parseInt(form.myBirthTime) : 12)
      }
      if (manseryeok && myManseryeok) {
        const c = calculateCompatibility(myManseryeok, manseryeok)
        compatibility = { ...c, elementHarmony: myManseryeok.dominantElement + " ↔ " + manseryeok.dominantElement }
      }

      await dbSsum.save({ id: editingId || undefined, ...form, signals, manseryeok, myManseryeok, compatibility, chatAnalysis })
      setShowForm(false)
      setEditingId(null)
      setForm({ nickname: "", birthDate: "", birthTime: "", myBirthDate: "", myBirthTime: "", duration: "", howWeMet: "", myOpinion: "", lastMessage: "", persona: "" })
      setSignals([])
      setChatFile(null)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패")
    }
    setSaving(false)
  }

  const handleEdit = (s: SsumRecord) => {
    const data = s as unknown as Record<string, string>
    setForm({
      nickname: data.nickname || "",
      birthDate: data.birthDate || "",
      birthTime: data.birthTime || "",
      myBirthDate: data.myBirthDate || "",
      myBirthTime: data.myBirthTime || "",
      duration: data.duration || "",
      howWeMet: data.howWeMet || "",
      myOpinion: data.myOpinion || "",
      lastMessage: data.lastMessage || "",
      persona: data.persona || "",
    })
    setSignals(s.signals || [])
    setEditingId(s.id)
    setShowForm(true)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNewForm = () => {
    setForm({ nickname: "", birthDate: "", birthTime: "", myBirthDate: "", myBirthTime: "", duration: "", howWeMet: "", myOpinion: "", lastMessage: "", persona: "" })
    setSignals([])
    setEditingId(null)
    setShowForm(!showForm)
  }

  const handleAnalyze = async (id: string) => {
    setAnalyzing(true)
    try {
      const res = await dbSsum.analyze(id, factLevel)
      setSelected((prev) => prev ? { ...prev, aiAnalysis: res.data } : prev)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "분석 실패")
    }
    setAnalyzing(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("이 썸붕 기록을 삭제할까요?")) return
    await dbSsum.delete(id)
    setSelected(null)
    reload()
  }

  if (status === "loading") return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl ghost-float inline-block">💔</div>
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">썸붕 분석실</h1>
        <p className="text-xs text-cemetery-ghost/40">썸이 왜 깨졌는지, 객관적으로 분석해드려요</p>
      </div>

      {/* 등록 버튼 */}
      <button onClick={handleNewForm}
        className="w-full py-3 bg-cemetery-card border border-dashed border-cemetery-border hover:border-cemetery-accent rounded-2xl text-sm text-cemetery-ghost hover:text-cemetery-heading transition-colors">
        {showForm ? "✕ 닫기" : "💔 썸붕 기록하기"}
      </button>

      {/* 등록 폼 */}
      {showForm && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4 animate-fade-in"
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
          <h2 className="text-sm font-semibold text-cemetery-heading">
            {editingId ? "✏️ 썸붕 기록 수정" : "썸붕 상대 정보"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">상대 닉네임 *</label>
              <input type="text" value={form.nickname} onChange={(e) => update("nickname", e.target.value)}
                placeholder="누구였나요" className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">썸 기간</label>
              <input type="text" value={form.duration} onChange={(e) => update("duration", e.target.value)}
                placeholder="예: 2개월, 3주" className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">상대 성별 + 생년월일</label>
              <GenderSelect value={(form as Record<string, string>).gender || ""} onChange={(v) => update("gender", v)} className="mb-2" />
              <DateInput value={form.birthDate} onChange={(v) => update("birthDate", v)} />
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">시간</label>
              <select value={form.birthTime} onChange={(e) => update("birthTime", e.target.value)}
                className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text text-sm focus:border-cemetery-accent focus:outline-none">
                {hourOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">나의 성별 + 생년월일</label>
              <GenderSelect value={(form as Record<string, string>).myGender || ""} onChange={(v) => update("myGender", v)} className="mb-2" />
              <DateInput value={form.myBirthDate} onChange={(v) => update("myBirthDate", v)} />
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">시간</label>
              <select value={form.myBirthTime} onChange={(e) => update("myBirthTime", e.target.value)}
                className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text text-sm focus:border-cemetery-accent focus:outline-none">
                {hourOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">상대 성격/MBTI</label>
            <input type="text" value={form.persona} onChange={(e) => update("persona", e.target.value)}
              placeholder="예: INFP, 조용하지만 가끔 텐션 높음" className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">만남 경위</label>
            <input type="text" value={form.howWeMet} onChange={(e) => update("howWeMet", e.target.value)}
              placeholder="예: 소개팅, 앱, 학교, 직장" className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
          </div>

          {/* 썸붕 징후 입력 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-2">💔 썸붕 징후 (자유롭게 입력)</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={signalInput}
                onChange={(e) => setSignalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSignal() } }}
                placeholder="예: 답장이 느려짐, 거절 의사 표현 등"
                className="flex-1 px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
              <button type="button" onClick={addSignal} disabled={!signalInput.trim()}
                className="px-3 py-2 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-lg text-sm transition-colors cute-press">
                추가
              </button>
            </div>
            {signals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {signals.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-full text-xs">
                    {s}
                    <button type="button" onClick={() => removeSignal(s)} className="hover:text-red-100 ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">💭 내가 생각하는 썸붕 이유</label>
            <textarea value={form.myOpinion} onChange={(e) => update("myOpinion", e.target.value)}
              placeholder="왜 안 됐다고 생각하나요? 솔직하게 적을수록 분석이 정확해져요."
              rows={4} maxLength={2000}
              className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none focus:border-cemetery-accent focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">📱 마지막 연락 내용</label>
            <input type="text" value={form.lastMessage} onChange={(e) => update("lastMessage", e.target.value)}
              placeholder="마지막 대화가 어떻게 끝났나요?" className="w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
          </div>

          {/* 카카오톡 파일 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">💬 카카오톡 대화 파일 (선택)</label>
            <input type="file" accept=".txt,.csv"
              onChange={(e) => setChatFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                file:bg-cemetery-accent file:text-white file:cursor-pointer file:text-xs" />
            <p className="text-[10px] text-cemetery-ghost/30 mt-1">
              카톡 &gt; 채팅방 &gt; 설정 &gt; 대화 내보내기 (.txt)
              {chatFile && " ✓ 파일 선택됨"}
            </p>
          </div>

          <button type="button" onClick={handleSave} disabled={saving || !form.nickname}
            className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold text-sm transition-colors cute-press">
            {saving ? "저장 중..." : editingId ? "✏️ 수정 저장" : "💔 썸붕 기록 저장"}
          </button>
        </div>
      )}

      {/* 썸붕 목록 */}
      {list.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-cemetery-heading">📋 썸붕 기록 ({list.length}건)</h2>
          {list.map((s) => (
            <div key={s.id} className={"bg-cemetery-card border rounded-2xl overflow-hidden transition-all " +
              (selected?.id === s.id ? "border-cemetery-accent" : "border-cemetery-border tombstone-hover")}>
              <button onClick={() => setSelected(selected?.id === s.id ? null : s)}
                className="w-full px-5 py-4 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💔</span>
                  <div>
                    <p className="text-sm font-semibold text-cemetery-heading">{s.nickname}</p>
                    <p className="text-[10px] text-cemetery-ghost/40">
                      {s.duration || "기간 미상"} · {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.compatibility && (
                    <span className="text-xs text-cemetery-accent">{s.compatibility.score}%</span>
                  )}
                  {s.aiAnalysis && <span className="text-[10px] text-green-400">분석완료</span>}
                </div>
              </button>

              {/* 상세 */}
              {selected?.id === s.id && (
                <div className="px-5 pb-5 border-t border-cemetery-border/30 pt-4 space-y-4 animate-fade-in">
                  {s.myOpinion && (
                    <div className="bg-cemetery-surface rounded-xl p-3">
                      <p className="text-[10px] text-cemetery-ghost/40 mb-1">💭 내가 생각하는 이유</p>
                      <p className="text-sm text-cemetery-text">{s.myOpinion}</p>
                    </div>
                  )}

                  {s.signals && s.signals.length > 0 && (
                    <div>
                      <p className="text-[10px] text-cemetery-ghost/40 mb-1">💔 감지된 징후</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.signals.map((sig) => (
                          <span key={sig} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-300 rounded-full">{sig}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.compatibility && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cemetery-accent">{s.compatibility.score}%</p>
                      <p className="text-[10px] text-cemetery-ghost/40">{s.compatibility.elementHarmony}</p>
                    </div>
                  )}

                  {/* 카톡 분석 */}
                  {s.chatAnalysis && (
                    <div className="bg-cemetery-surface/50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-cemetery-heading">💬 카카오톡 분석</p>
                      <ChatStats analysis={s.chatAnalysis} />
                    </div>
                  )}

                  {/* 수사학 분석 */}
                  <SsumRhetoricAnalysis record={s} />

                  {/* 편집 버튼 */}
                  <button onClick={() => handleEdit(s)}
                    className="w-full py-2 bg-cemetery-surface border border-cemetery-border hover:border-cemetery-accent rounded-xl text-xs text-cemetery-ghost transition-colors cute-press">
                    ✏️ 내용 수정하기
                  </button>

                  {/* 팩폭 레벨 + AI 분석 */}
                  {s.aiAnalysis ? (
                    <div className="space-y-3">
                      <div className="bg-cemetery-surface rounded-xl p-4">
                        <p className="text-[10px] text-cemetery-accent mb-2">🔍 AI + 연애고수 분석</p>
                        <p className="text-sm text-cemetery-text whitespace-pre-wrap leading-relaxed">{s.aiAnalysis}</p>
                      </div>
                      {/* 재분석 */}
                      <div className="bg-cemetery-surface rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cemetery-ghost/50">💣 팩폭 강도 바꿔서 재분석</span>
                          <span className="text-xs font-bold" style={{
                            color: factLevel <= 2 ? "#7eecd0" : factLevel === 3 ? "#e0e0f0" : factLevel === 4 ? "#ffaa33" : "#ff4466"
                          }}>
                            {["", "🧸", "😊", "⚖️", "🔥", "💀"][factLevel]}
                          </span>
                        </div>
                        <input type="range" min={1} max={5} value={factLevel}
                          onChange={(e) => setFactLevel(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer"
                          style={{ background: "linear-gradient(to right, #7eecd0 0%, #e0e0f0 50%, #ff4466 100%)" }} />
                        {analyzing ? (
                          <div className="text-center py-3 space-y-2">
                            <div className="flex justify-center gap-1.5">
                              <span className="w-2 h-2 bg-cemetery-accent rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                              <span className="w-2 h-2 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                            </div>
                            <p key={quoteIdx} className="text-xs text-cemetery-heading/70 italic animate-fade-in">
                              &ldquo;{SSUM_QUOTES[quoteIdx]}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <button onClick={() => { setSelected((prev) => prev ? { ...prev, aiAnalysis: undefined } : prev); handleAnalyze(s.id) }}
                            className="w-full py-2 bg-cemetery-accent/20 hover:bg-cemetery-accent/30 rounded-lg text-xs text-cemetery-accent transition-colors cute-press">
                            🔄 재분석
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 팩폭 레벨 슬라이더 */}
                      <div className="bg-cemetery-surface rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-cemetery-ghost/50">💣 팩폭 강도</label>
                          <span className="text-sm font-bold" style={{
                            color: factLevel <= 2 ? "#7eecd0" : factLevel === 3 ? "#e0e0f0" : factLevel === 4 ? "#ffaa33" : "#ff4466"
                          }}>
                            {["", "🧸 순한맛", "😊 살짝", "⚖️ 균형", "🔥 직설", "💀 극강"][factLevel]}
                          </span>
                        </div>
                        <input type="range" min={1} max={5} value={factLevel}
                          onChange={(e) => setFactLevel(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: "linear-gradient(to right, #7eecd0 0%, #e0e0f0 50%, #ff4466 100%)",
                          }} />
                        <p className="text-[10px] text-cemetery-ghost/50 text-center">
                          {factLevel === 1 ? "\"네 잘못이 아니야\" 위주 위로 (공감 90%)"
                            : factLevel === 2 ? "\"혹시 이런 건 아니었을까?\" 조심스러운 지적 (공감 70%)"
                            : factLevel === 3 ? "위로와 현실을 균형있게 (공감 50% + 팩트 50%)"
                            : factLevel === 4 ? "\"솔직히 말하면...\" 구체적 지적 (팩트 80%)"
                            : "\"야 진짜 솔직히 말할게\" 듣기 싫은 진실까지 (팩트 95%)"}
                        </p>
                      </div>
                      {analyzing ? (
                        <div className="text-center py-4 space-y-3">
                          <div className="flex justify-center gap-2">
                            <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" />
                            <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                            <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                          </div>
                          <p className="text-xs text-cemetery-ghost/40">사주 + 연애고수 의견 수집 중...</p>
                          <p key={quoteIdx} className="text-sm text-cemetery-heading/80 italic font-gothic leading-relaxed max-w-xs mx-auto animate-fade-in">
                            &ldquo;{SSUM_QUOTES[quoteIdx]}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <button onClick={() => handleAnalyze(s.id)}
                          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors cute-press">
                          🔍 종합 분석 요청 (사주 + 현실 조언)
                        </button>
                      )}
                    </div>
                  )}

                  <button onClick={() => handleDelete(s.id)}
                    className="w-full py-2 text-xs text-cemetery-ghost/30 hover:text-red-400 transition-colors">
                    기록 삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && !showForm && (
        <div className="text-center py-12 text-cemetery-ghost/30">
          <span className="text-4xl">💔</span>
          <p className="text-sm mt-2">아직 썸붕 기록이 없어요</p>
        </div>
      )}
    </div>
  )
}

/** 썸붕 수사학 분석: 등록 데이터 기반으로 소통 패턴 분석 */
function SsumRhetoricAnalysis({ record }: { record: SsumRecord }) {
  const signals = record.signals || []
  const hasOpinion = !!record.myOpinion
  const hasLastMsg = !!record.lastMessage
  const hasPersona = !!record.persona
  const compatScore = record.compatibility?.score || 0

  // 데이터 충분성 체크
  if (signals.length === 0 && !hasOpinion && !hasLastMsg) return null

  // --- 에토스 (신뢰 기반) ---
  let ethosScore = 50
  const trustSignals = signals.filter((s) =>
    ["답장 느림", "연락 줄어듬", "약속 취소", "읽씹", "잠수"].some((k) => s.includes(k))
  )
  const effortSignals = signals.filter((s) =>
    ["먼저 연락", "자주 만남", "선물", "기념일", "관심"].some((k) => s.includes(k))
  )
  ethosScore -= trustSignals.length * 12
  ethosScore += effortSignals.length * 10
  if (compatScore > 70) ethosScore += 10
  else if (compatScore < 40 && compatScore > 0) ethosScore -= 10
  ethosScore = Math.max(0, Math.min(100, ethosScore))

  // --- 파토스 (감정 기반) ---
  let pathosScore = 50
  const emotionSignals = signals.filter((s) =>
    ["감정", "싸움", "질투", "불안", "눈물", "화남", "서운", "무관심"].some((k) => s.includes(k))
  )
  pathosScore += emotionSignals.length * 8 // 감정 징후 많으면 감정 소통은 활발
  if (hasOpinion && record.myOpinion.length > 50) pathosScore += 15 // 본인 성찰 깊음
  if (hasLastMsg) pathosScore += 10
  pathosScore = Math.max(0, Math.min(100, pathosScore))

  // --- 로고스 (논리 기반) ---
  let logosScore = 50
  logosScore += signals.length * 5 // 징후를 많이 파악할수록 분석력 높음
  if (hasOpinion) logosScore += 10
  if (hasPersona) logosScore += 10
  const logicSignals = signals.filter((s) =>
    ["가치관", "목표", "미래", "방향", "대화 부족", "소통"].some((k) => s.includes(k))
  )
  logosScore += logicSignals.length * 8
  logosScore = Math.max(0, Math.min(100, logosScore))

  // 소통 실패 유형 판정
  const maxScore = Math.max(ethosScore, pathosScore, logosScore)
  const minScore = Math.min(ethosScore, pathosScore, logosScore)
  const failType = minScore === ethosScore ? "신뢰 부족형"
    : minScore === pathosScore ? "감정 교류 부족형"
    : "논리/소통 부족형"

  // 인사이트 도출
  const insights: string[] = []

  if (trustSignals.length >= 2) {
    insights.push(`신뢰 훼손 징후가 ${trustSignals.length}개 감지됩니다 (${trustSignals.join(", ")}). 에토스(신뢰)가 무너지면 어떤 말도 설득력을 잃게 됩니다. 이 관계에서 신뢰 회복의 기회가 있었는지 돌아보세요.`)
  }

  if (emotionSignals.length >= 2) {
    insights.push(`감정 관련 징후가 ${emotionSignals.length}개입니다. 감정 소통(파토스)은 활발했지만, 감정의 방향이 부정적이었을 가능성이 높아요. 좋은 감정 교류 없이 갈등만 반복되면 관계는 소모됩니다.`)
  } else if (emotionSignals.length === 0 && signals.length > 0) {
    insights.push(`감정 관련 징후가 없습니다. 감정을 표현하지 못했거나, 상대가 감정을 드러내지 않은 관계였을 수 있어요. 파토스(감정 교류)가 부족하면 관계가 사무적으로 느껴집니다.`)
  }

  if (logicSignals.length >= 1) {
    insights.push(`"${logicSignals[0]}" 같은 근본적인 소통 문제가 있었습니다. 로고스(논리적 소통)의 부재는 서로의 생각과 기대를 공유하지 못하게 만들어요.`)
  }

  if (hasLastMsg && record.lastMessage.length > 10) {
    insights.push(`마지막 메시지가 기록되어 있습니다. 수사학적으로 '마지막 말'은 관계에 대한 최종 태도를 반영합니다. 그 메시지가 설명(로고스)이었는지, 감정 호소(파토스)였는지, 단절(에토스 포기)이었는지 되돌아보세요.`)
  }

  if (compatScore > 0 && compatScore < 40) {
    insights.push(`사주 궁합이 ${compatScore}%로 낮은 편입니다. 기본적인 기질 차이가 소통 방식에도 영향을 미쳤을 수 있어요. 다음 관계에서는 소통 스타일이 맞는 사람을 찾아보세요.`)
  }

  const SCORES = [
    { label: "에토스 (신뢰)", score: ethosScore, color: "bg-blue-400",
      detail: ethosScore > 60 ? "기본적인 신뢰 관계는 유지되었으나, 썸 단계의 불확실성이 영향을 미쳤을 수 있어요."
        : ethosScore > 30 ? "신뢰 관련 징후가 감지됩니다. 상대의 일관성 부족이 관계 불안을 키웠을 가능성이 있어요."
        : "신뢰 기반이 크게 흔들린 관계입니다. 상대의 행동에서 일관성을 찾기 어려웠을 거예요." },
    { label: "파토스 (감정)", score: pathosScore, color: "bg-red-400",
      detail: pathosScore > 60 ? "감정 교류가 활발한 관계였습니다. 감정이 오갔다는 건 서로에게 의미가 있었다는 뜻이에요."
        : pathosScore > 30 ? "감정 표현이 제한적이었을 수 있어요. 속마음을 더 나눴다면 결과가 달랐을 수도 있습니다."
        : "감정 교류가 부족한 관계였습니다. 서로의 감정을 확인하지 못한 채 끝났을 가능성이 높아요." },
    { label: "로고스 (논리)", score: logosScore, color: "bg-green-400",
      detail: logosScore > 60 ? "상황을 객관적으로 파악하고 있어요. 이 경험에서 배운 점을 다음 관계에 적용할 수 있을 거예요."
        : logosScore > 30 ? "원인 분석이 어느 정도 되어 있지만, 더 구체적인 징후나 맥락을 돌아보면 성장에 도움이 됩니다."
        : "아직 상황 파악이 충분하지 않아요. 징후와 본인의 생각을 더 기록해보면 패턴이 보일 거예요." },
  ]

  return (
    <div className="space-y-4 bg-cemetery-surface/30 border border-cemetery-border/30 rounded-xl p-4">
      <div>
        <h4 className="text-sm text-cemetery-heading font-semibold">📜 수사학 분석</h4>
        <p className="text-xs text-cemetery-ghost/40 mt-0.5">등록된 징후와 정보 기반 소통 패턴 분석</p>
      </div>

      {/* 실패 유형 */}
      <div className="bg-cemetery-surface rounded-xl p-3 text-center">
        <p className="text-xs text-cemetery-ghost/50 mb-1">썸붕 소통 유형</p>
        <p className="text-lg font-bold text-red-400">{failType}</p>
        <p className="text-xs text-cemetery-ghost/50 mt-1">
          {failType === "신뢰 부족형" ? "상대의 일관성 없는 행동이 관계의 기반을 흔들었어요" :
           failType === "감정 교류 부족형" ? "서로의 마음을 충분히 확인하지 못한 채 끝났어요" :
           "대화와 소통의 부재가 관계를 멀어지게 했어요"}
        </p>
      </div>

      {/* 3요소 점수 */}
      <div className="space-y-2.5">
        {SCORES.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cemetery-text">{s.label}</span>
              <span className={`text-xs font-bold ${s.score > 60 ? "text-green-400" : s.score > 30 ? "text-yellow-400" : "text-red-400"}`}>
                {s.score}점
              </span>
            </div>
            <div className="h-2 bg-cemetery-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${s.score}%` }} />
            </div>
            <p className="text-[10px] text-cemetery-ghost/50 mt-0.5 leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>

      {/* 인사이트 */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-cemetery-heading">💡 인사이트</h4>
          {insights.map((insight, i) => (
            <div key={i} className="bg-cemetery-surface/50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-cemetery-text leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
