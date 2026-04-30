"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Grave, GraveGrade } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { dbGraves, dbCrushes, dbAnalysis } from "@/lib/api-client"

interface CrushData { id: string; nickname: string; birthDate: string; birthTime: string; persona: string; chatStyle: string }
interface RecordData { id: string; crushName: string; comparedWith?: string; score: number; aiAdvice: string; createdAt: string }
import { calculateManseryeok, calculateCompatibility } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"
import { PillarDisplay } from "@/components/PillarDisplay"

interface CurrentPerson {
  nickname: string
  birthDate: string
  birthTime: string
  persona: string
  chatStyle: string
}

export default function LovePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [person, setPerson] = useState<CurrentPerson>({
    nickname: "",
    birthDate: "",
    birthTime: "",
    persona: "",
    chatStyle: "",
  })
  const [graves, setGraves] = useState<Grave[]>([])
  const [crushes, setCrushes] = useState<CrushData[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null)
  const [myBirthDate, setMyBirthDate] = useState("")
  const [myBirthTime, setMyBirthTime] = useState("")
  const [result, setResult] = useState<{
    personManseryeok: ReturnType<typeof calculateManseryeok>
    myManseryeok: ReturnType<typeof calculateManseryeok>
    compatibility: ReturnType<typeof calculateCompatibility> & { elementHarmony: string }
  } | null>(null)
  const [aiAdvice, setAiAdvice] = useState("")
  const [loading, setLoading] = useState(false)
  const [hearts, setHearts] = useState<number[]>([])
  const [records, setRecords] = useState<RecordData[]>([])
  const [viewingRecord, setViewingRecord] = useState<RecordData | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) {
      dbGraves.list(userId).then((d) => setGraves(d || []))
      dbCrushes.list(userId).then((d) => setCrushes(d || []))
      dbAnalysis.list(userId).then((d) => setRecords(d || []))
    }
  }, [userId, status, router])

  // 하트 파티클
  useEffect(() => {
    setHearts(Array.from({ length: 15 }, (_, i) => i))
  }, [])

  const hourOptions = [
    { value: "", label: "모름" },
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

  const handleAnalyze = () => {
    if (!person.birthDate || !myBirthDate) return

    const [py, pm, pd] = person.birthDate.split("-").map(Number)
    const pHour = person.birthTime ? parseInt(person.birthTime) : 12
    const personM = calculateManseryeok(py, pm, pd, pHour)

    const [my, mm, md] = myBirthDate.split("-").map(Number)
    const mHour = myBirthTime ? parseInt(myBirthTime) : 12
    const myM = calculateManseryeok(my, mm, md, mHour)

    const compat = calculateCompatibility(myM, personM)

    setResult({
      personManseryeok: personM,
      myManseryeok: myM,
      compatibility: {
        ...compat,
        elementHarmony: `${myM.dominantElement} ↔ ${personM.dominantElement}`,
      },
    })
  }

  const handleAiAdvice = async () => {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch("/api/love-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: {
            nickname: person.nickname,
            persona: person.persona,
            chatStyle: person.chatStyle,
            manseryeok: result.personManseryeok,
          },
          my: { manseryeok: result.myManseryeok },
          compatibility: result.compatibility,
          pastGraves: graves.map((g) => ({
            nickname: g.nickname,
            grade: g.grade,
            causeOfDeath: g.causeOfDeath,
            graveReason: g.graveReason,
            manseryeok: g.manseryeok,
            compatibility: g.compatibility,
            chatAnalysis: g.chatAnalysis ? {
              loveTemperature: g.chatAnalysis.loveTemperature,
              sentimentScore: g.chatAnalysis.sentimentScore,
              topTopics: g.chatAnalysis.topTopics,
            } : undefined,
          })),
          selectedPast: selectedGrave ? {
            nickname: selectedGrave.nickname,
            graveReason: selectedGrave.graveReason,
            causeOfDeath: selectedGrave.causeOfDeath,
            manseryeok: selectedGrave.manseryeok,
            compatibility: selectedGrave.compatibility,
          } : undefined,
        }),
      })
      const data = await res.json()
      setAiAdvice(data.advice)
      // 분석 기록 자동 저장
      if (userId && data.advice && !data.advice.startsWith("⚠️")) {
        await dbAnalysis.save(userId, {
          crushName: person.nickname,
          comparedWith: selectedGrave?.nickname,
          score: result.compatibility.score,
          aiAdvice: data.advice,
        })
        const updated = await dbAnalysis.list(userId)
        setRecords(updated || [])
      }
    } catch {
      setAiAdvice("분석 중 오류가 발생했어요.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCrush = async () => {
    if (!userId || !person.nickname) return
    const crush = {
      id: editingId || Math.random().toString(36).slice(2) + Date.now().toString(36),
      ...person,
    }
    await dbCrushes.save(userId, crush)
    const updated = await dbCrushes.list(userId)
    setCrushes(updated || [])
    setEditingId(crush.id)
  }

  const handleLoadCrush = (crush: CrushData) => {
    setPerson({
      nickname: crush.nickname || "",
      birthDate: crush.birthDate || "",
      birthTime: crush.birthTime || "",
      persona: crush.persona || "",
      chatStyle: crush.chatStyle || "",
    })
    setEditingId(crush.id)
    setResult(null)
    setAiAdvice("")
  }

  const handleDeleteCrush = async (id: string) => {
    if (!userId) return
    if (!confirm("이 사람 정보를 삭제할까요?")) return
    await dbCrushes.delete(userId, id)
    const updated = await dbCrushes.list(userId)
    setCrushes(updated || [])
    if (editingId === id) setEditingId(null)
  }

  const handleNewCrush = () => {
    setPerson({ nickname: "", birthDate: "", birthTime: "", persona: "", chatStyle: "" })
    setEditingId(null)
    setResult(null)
    setAiAdvice("")
  }

  const update = (field: keyof CurrentPerson, value: string) =>
    setPerson((prev) => ({ ...prev, [field]: value }))

  if (status === "loading") return null

  return (
    <div className="relative min-h-screen">
      {/* 떠다니는 하트 배경 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {hearts.map((i) => (
          <span
            key={i}
            className="absolute text-pink-400/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              fontSize: `${12 + Math.random() * 20}px`,
              animation: `float-hearts ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center py-10 space-y-4">
          <div className="text-5xl love-sway inline-block">💘</div>
          <h1 className="text-4xl font-black" style={{ color: "#ff8ec4" }}>
            살랑살랑
          </h1>
          <p className="text-pink-300/60 text-sm">
            지금 설레는 그 사람, 과거의 연애와 뭐가 다를까?
          </p>
        </div>

        {/* 저장된 썸 목록 */}
        {crushes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm" style={{ color: "#ffaad4" }}>💾 저장된 사람</h2>
              <button
                onClick={handleNewCrush}
                className="text-xs text-pink-300/40 hover:text-pink-300 transition-colors"
              >
                + 새 사람 추가
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {crushes.map((c) => (
                <div
                  key={c.id as string}
                  className={`relative flex-shrink-0 group cursor-pointer rounded-xl border px-4 py-3 text-center min-w-[90px] transition-all
                    ${editingId === c.id
                      ? "border-pink-400/50 bg-pink-500/10"
                      : "border-pink-500/10 bg-pink-500/5 hover:border-pink-400/30"
                    }`}
                >
                  <div onClick={() => handleLoadCrush(c)}>
                    <div className="text-2xl mb-1">💘</div>
                    <p className="text-xs text-pink-200/70 truncate">{c.nickname}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCrush(c.id) }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-900/80 rounded-full text-[10px]
                      opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 입력 폼 */}
        <div className="love-card border rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "#ffaad4" }}>
              💕 {editingId ? person.nickname || "수정 중" : "지금 만나는 사람"}
            </h2>
            {person.nickname && (
              <button
                onClick={handleSaveCrush}
                className="text-xs px-3 py-1 rounded-full border border-pink-400/30 text-pink-300/60
                  hover:bg-pink-500/10 hover:text-pink-300 transition-all"
              >
                💾 저장
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-pink-300/50 mb-1">이름/닉네임 *</label>
              <input
                type="text"
                value={person.nickname}
                onChange={(e) => update("nickname", e.target.value)}
                placeholder="설레는 그 사람"
                className="w-full px-3 py-2.5 rounded-xl love-input"
              />
            </div>
            <div>
              <label className="block text-xs text-pink-300/50 mb-1">생년월일 *</label>
              <DateInput
                value={person.birthDate}
                onChange={(v) => update("birthDate", v)}
                placeholder="생년월일"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-pink-300/50 mb-1">태어난 시간</label>
              <select
                value={person.birthTime}
                onChange={(e) => update("birthTime", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl love-input"
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-pink-300/50 mb-1">성격/MBTI</label>
              <input
                type="text"
                value={person.persona}
                onChange={(e) => update("persona", e.target.value)}
                placeholder="예: ENFP, 유쾌하고 에너지 넘침"
                className="w-full px-3 py-2.5 rounded-xl love-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-pink-300/50 mb-1">카톡/대화 스타일</label>
            <textarea
              value={person.chatStyle}
              onChange={(e) => update("chatStyle", e.target.value)}
              placeholder="예: 답장 빠름, 이모티콘 많이 씀, 전화 선호, 새벽에 주로 연락..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl love-input resize-none"
            />
          </div>

          <div className="border-t border-pink-500/10 pt-4 space-y-3">
            <h3 className="text-sm" style={{ color: "#ffaad4" }}>나의 생년월일</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                value={myBirthDate}
                onChange={setMyBirthDate}
                placeholder="내 생년월일"
              />
              <select
                value={myBirthTime}
                onChange={(e) => setMyBirthTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl love-input"
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!person.nickname || !person.birthDate || !myBirthDate}
            className="w-full py-3 rounded-xl love-btn font-semibold disabled:opacity-40"
          >
            💘 궁합 분석하기
          </button>
        </div>

        {/* 결과 */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* 궁합 점수 */}
            <div className="love-card border rounded-2xl p-8 text-center space-y-4">
              <p className="text-pink-300/50 text-sm">
                나 ↔ {person.nickname}
              </p>
              <div className="relative inline-block">
                <span className="text-6xl font-black heartbeat inline-block" style={{ color: "#ff8ec4" }}>
                  {result.compatibility.score}%
                </span>
              </div>
              <p className="text-pink-300/40 text-xs">
                {result.compatibility.elementHarmony}
              </p>
            </div>

            {/* 강점/약점 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="love-card border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: "#7eecd0" }}>💚 이런 점이 좋아요</h3>
                <ul className="space-y-2">
                  {result.compatibility.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-pink-200/70 leading-relaxed">✦ {s}</li>
                  ))}
                </ul>
              </div>
              <div className="love-card border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-orange-300">⚡ 주의할 점</h3>
                <ul className="space-y-2">
                  {result.compatibility.weaknesses.length > 0
                    ? result.compatibility.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-pink-200/70 leading-relaxed">⚠ {w}</li>
                      ))
                    : <li className="text-xs text-pink-200/40">특별한 주의사항이 없어요!</li>
                  }
                </ul>
              </div>
            </div>

            {/* 사주 비교 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="love-card border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm text-pink-300/50">내 사주</h3>
                <PillarDisplay result={result.myManseryeok} />
              </div>
              <div className="love-card border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm text-pink-300/50">{person.nickname} 사주</h3>
                <PillarDisplay result={result.personManseryeok} />
              </div>
            </div>

            {/* 과거 연애와 비교 */}
            {graves.length > 0 && (
              <div className="love-card border rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: "#ffaad4" }}>
                  ⚰️ 과거 연애와 비교하기
                </h3>
                <p className="text-xs text-pink-300/40">
                  비교할 과거 연애를 선택하면 AI가 차이점을 분석해줘요
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {graves.map((g) => {
                    const info = GRAVE_GRADES[g.grade || "public"]
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          const next = selectedGrave?.id === g.id ? null : g
                          setSelectedGrave(next)
                          if (aiAdvice) setAiAdvice("") // 비교 대상 바꾸면 이전 분석 초기화
                        }}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center transition-all min-w-[100px]
                          ${selectedGrave?.id === g.id
                            ? "border-pink-400/50 bg-pink-500/10"
                            : "border-pink-500/10 bg-pink-500/5 hover:border-pink-400/30"
                          }`}
                      >
                        {g.photo ? (
                          <img src={g.photo} alt="" className="w-10 h-10 rounded-full mx-auto mb-1 grayscale-[50%]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-500/10 mx-auto mb-1 flex items-center justify-center text-lg">
                            {info.emoji}
                          </div>
                        )}
                        <p className="text-xs text-pink-200/70 truncate">{g.nickname}</p>
                        {g.compatibility && (
                          <p className="text-[10px] text-pink-300/40">{g.compatibility.score}%</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI 조언 */}
            <div className="love-card border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "#ffaad4" }}>
                  🔮 AI 연애 조언
                </h3>
                {aiAdvice && (
                  <button
                    onClick={() => { setAiAdvice(""); handleAiAdvice() }}
                    className="text-[10px] text-pink-300/40 hover:text-pink-300 transition-colors"
                  >
                    🔄 다시 분석
                  </button>
                )}
              </div>
              {aiAdvice ? (
                <div className="text-sm text-pink-200/80 whitespace-pre-wrap leading-relaxed love-shimmer rounded-xl p-4">
                  {aiAdvice}
                </div>
              ) : loading ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-3xl heartbeat inline-block">💘</div>
                  <p className="text-pink-300/40 text-xs animate-pulse">두 사람의 인연을 살펴보고 있어요...</p>
                </div>
              ) : (
                <button
                  onClick={handleAiAdvice}
                  className="w-full py-3 rounded-xl love-btn font-semibold"
                >
                  💌 AI에게 연애 조언 받기
                  {selectedGrave && ` (vs ${selectedGrave.nickname} 비교 포함)`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 과거 분석 기록 */}
        {records.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: "#ffaad4" }}>
              📋 분석 기록 ({records.length}건)
            </h2>
            <div className="space-y-3">
              {records.map((rec) => (
                <div key={rec.id} className="love-card border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setViewingRecord(viewingRecord?.id === rec.id ? null : rec)}
                    className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-pink-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💘</span>
                      <div>
                        <p className="text-sm text-pink-200/80">
                          {rec.crushName}
                          {rec.comparedWith && (
                            <span className="text-pink-300/40"> vs {rec.comparedWith}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-pink-300/30">
                          {new Date(rec.createdAt).toLocaleDateString("ko-KR")} · 궁합 {rec.score}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-pink-300/30">
                        {viewingRecord?.id === rec.id ? "▲" : "▼"}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!userId) return
                          await dbAnalysis.delete(userId, rec.id as string)
                          const updated = await dbAnalysis.list(userId)
                          setRecords(updated || [])
                          if (viewingRecord?.id === rec.id) setViewingRecord(null)
                        }}
                        className="text-[10px] text-pink-300/20 hover:text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </button>
                  {viewingRecord?.id === rec.id && (
                    <div className="px-5 pb-4 border-t border-pink-500/10 pt-3 animate-fade-in">
                      <p className="text-sm text-pink-200/70 whitespace-pre-wrap leading-relaxed">
                        {rec.aiAdvice}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 네비 */}
        <div className="text-center pb-8">
          <a href="/" className="text-pink-300/30 text-xs hover:text-pink-300/60 transition-colors">
            ← 명예의전당으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
