"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbSajuProfile } from "@/lib/community-client"
import { calculateManseryeok } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"
import type { SajuProfile } from "@/types/community"

export default function MatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || ""

  const [profile, setProfile] = useState<SajuProfile | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [mbti, setMbti] = useState("")
  const [introduction, setIntroduction] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [matches, setMatches] = useState<Array<SajuProfile & { matchScore: number }>>([])
  const [loading, setLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)

  const hourOptions = [
    { value: "", label: "모름" },
    { value: "0", label: "자시" }, { value: "2", label: "축시" },
    { value: "4", label: "인시" }, { value: "6", label: "묘시" },
    { value: "8", label: "진시" }, { value: "10", label: "사시" },
    { value: "12", label: "오시" }, { value: "14", label: "미시" },
    { value: "16", label: "신시" }, { value: "18", label: "유시" },
    { value: "20", label: "술시" }, { value: "22", label: "해시" },
  ]

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) {
      dbSajuProfile.get(userId).then((res) => {
        if (res.data) {
          setProfile(res.data)
          setBirthDate(res.data.birthDate || "")
          setBirthTime(res.data.birthTime || "")
          setMbti(res.data.mbti || "")
          setIntroduction(res.data.introduction || "")
          setLookingFor(res.data.lookingFor || "")
        }
      })
    }
  }, [userId, status, router])

  const [error, setError] = useState("")

  const handleRegister = async () => {
    if (!userId || !birthDate) {
      setError("생년월일을 입력해주세요")
      return
    }
    setLoading(true)
    setError("")
    try {
      const [y, m, d] = birthDate.split("-").map(Number)
      const hour = birthTime ? parseInt(birthTime) : 12
      const result = calculateManseryeok(y, m, d, hour)

      const ilju = `${result.fourPillars.day.stem}${result.fourPillars.day.branch}`
      const res = await dbSajuProfile.register(userId, userName, {
        birthDate, birthTime, mbti: mbti || undefined, ilju,
        dominantElement: result.dominantElement,
        elementBalance: result.elementBalance,
        introduction, lookingFor,
        isPublic: true,
      })
      setProfile(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleMatch = async () => {
    if (!userId) return
    setMatchLoading(true)
    try {
      const res = await dbSajuProfile.findMatches(userId)
      setMatches(res.data || [])
    } catch (err) {
      alert(err instanceof Error ? err.message : "매칭 실패")
    }
    setMatchLoading(false)
  }

  const ELEMENT_EMOJI: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" }
  const ELEMENT_COLOR: Record<string, string> = { 목: "text-green-400", 화: "text-red-400", 토: "text-yellow-400", 금: "text-gray-300", 수: "text-blue-400" }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">💘 궁합 매칭</h1>
        <p className="text-xs text-cemetery-ghost/40">사주 프로필을 등록하고 잘 맞는 유령을 찾아보세요</p>
      </div>

      {/* 프로필 등록/수정 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-cemetery-heading">
          {profile ? "✏️ 내 사주 프로필" : "📝 사주 프로필 등록"}
        </h2>

        {profile && (
          <div className="flex items-center gap-3 p-3 bg-cemetery-surface rounded-xl">
            <span className="text-2xl">{ELEMENT_EMOJI[profile.dominantElement] || "🔮"}</span>
            <div>
              <p className={`text-sm font-semibold ${ELEMENT_COLOR[profile.dominantElement] || ""}`}>
                {profile.nickname} · {profile.dominantElement}({["목", "화", "토", "금", "수"].indexOf(profile.dominantElement) >= 0 ? ["Wood", "Fire", "Earth", "Metal", "Water"][["목", "화", "토", "금", "수"].indexOf(profile.dominantElement)] : ""})
              </p>
              <p className="text-[10px] text-cemetery-ghost/40">{profile.introduction || "소개 미작성"}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">생년월일 *</label>
            <DateInput value={birthDate} onChange={setBirthDate} placeholder="생년월일" />
          </div>
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">시간</label>
            <select value={birthTime} onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text text-sm focus:border-cemetery-accent focus:outline-none">
              {hourOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">MBTI</label>
          <div className="grid grid-cols-4 gap-1.5">
            {["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"].map((m) => (
              <button key={m} type="button" onClick={() => setMbti(m)}
                className={`py-1.5 rounded-lg text-[11px] transition-all ${mbti === m
                  ? "bg-cemetery-accent text-white"
                  : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-accent"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">자기소개</label>
          <textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)}
            placeholder="간단한 자기소개..."
            rows={2} maxLength={500}
            className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none focus:border-cemetery-accent focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">찾는 유형</label>
          <input type="text" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)}
            placeholder="예: 따뜻한 사람, 유머있는 사람..."
            maxLength={200}
            className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 text-sm focus:border-cemetery-accent focus:outline-none" />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">⚠️ {error}</p>
        )}

        <button onClick={handleRegister} disabled={!birthDate || loading}
          className="w-full py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors cute-press">
          {loading ? "저장 중..." : profile ? "✅ 프로필 업데이트" : "프로필 등록"}
        </button>
      </div>

      {/* 매칭 */}
      {profile && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cemetery-heading">🔍 궁합 매칭 (🪙 30코인)</h2>

          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((m, i) => (
                <div key={m.id} className="bg-cemetery-surface rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ELEMENT_EMOJI[m.dominantElement] || "🔮"}</span>
                      <div>
                        <p className="text-sm font-semibold text-cemetery-heading">{m.nickname}</p>
                        <p className={`text-xs ${ELEMENT_COLOR[m.dominantElement] || ""}`}>{m.dominantElement} 기운</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-cemetery-accent">{m.matchScore}%</p>
                      <p className="text-[9px] text-cemetery-ghost/30">궁합</p>
                    </div>
                  </div>
                  {m.introduction && <p className="text-xs text-cemetery-ghost/60">{m.introduction}</p>}
                  {m.lookingFor && <p className="text-[10px] text-cemetery-ghost/30 mt-1">찾는 유형: {m.lookingFor}</p>}
                </div>
              ))}
              <button onClick={handleMatch} className="w-full py-2 text-xs text-cemetery-ghost/40 hover:text-cemetery-accent transition-colors">
                🔄 다시 매칭 (🪙 30)
              </button>
            </div>
          ) : (
            <button onClick={handleMatch} disabled={matchLoading}
              className="w-full py-3 bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors cute-press">
              {matchLoading ? "매칭 중..." : "💘 궁합 맞는 유령 찾기"}
            </button>
          )}
        </div>
      )}

      <a href="/community" className="block text-center text-xs text-cemetery-ghost/30 hover:text-cemetery-ghost/60 transition-colors">
        ← 커뮤니티로 돌아가기
      </a>
    </div>
  )
}
