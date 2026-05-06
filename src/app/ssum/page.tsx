"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbSsum } from "@/lib/ssum-client"
import { calculateManseryeok, calculateCompatibility } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"

interface SsumRecord {
  id: string; nickname: string; photo?: string; duration: string; howWeMet: string
  myOpinion: string; signals: string[]; lastMessage: string; persona: string
  compatibility?: { score: number; elementHarmony: string }
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
  const [saving, setSaving] = useState(false)

  const hourOptions = [
    { value: "", label: "모름" }, { value: "0", label: "자시" }, { value: "2", label: "축시" },
    { value: "4", label: "인시" }, { value: "6", label: "묘시" }, { value: "8", label: "진시" },
    { value: "10", label: "사시" }, { value: "12", label: "오시" }, { value: "14", label: "미시" },
    { value: "16", label: "신시" }, { value: "18", label: "유시" }, { value: "20", label: "술시" },
    { value: "22", label: "해시" },
  ]

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) reload()
  }, [userId, status, router])

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

      await dbSsum.save({ id: editingId || undefined, ...form, signals, manseryeok, myManseryeok, compatibility })
      setShowForm(false)
      setEditingId(null)
      setForm({ nickname: "", birthDate: "", birthTime: "", myBirthDate: "", myBirthTime: "", duration: "", howWeMet: "", myOpinion: "", lastMessage: "", persona: "" })
      setSignals([])
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
              <label className="block text-xs text-cemetery-ghost/50 mb-1">상대 생년월일</label>
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
              <label className="block text-xs text-cemetery-ghost/50 mb-1">나의 생년월일</label>
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
                        <button onClick={() => { setSelected((prev) => prev ? { ...prev, aiAnalysis: undefined } : prev); handleAnalyze(s.id) }}
                          disabled={analyzing}
                          className="w-full py-2 bg-cemetery-accent/20 hover:bg-cemetery-accent/30 disabled:opacity-40 rounded-lg text-xs text-cemetery-accent transition-colors cute-press">
                          {analyzing ? "재분석 중..." : "🔄 재분석"}
                        </button>
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
                        <p className="text-[10px] text-cemetery-ghost/30 text-center">
                          {factLevel <= 2 ? "위로 위주, 팩트는 완곡하게"
                            : factLevel === 3 ? "공감 50% + 팩트 50%"
                            : factLevel === 4 ? "꽤 직설적, 듣기 싫은 말도"
                            : "친구가 술자리에서 하는 수준의 팩폭"}
                        </p>
                      </div>
                      <button onClick={() => handleAnalyze(s.id)} disabled={analyzing}
                        className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors cute-press">
                        {analyzing ? "사주 + 연애고수 의견 수집 중..." : "🔍 종합 분석 요청 (사주 + 현실 조언)"}
                      </button>
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
