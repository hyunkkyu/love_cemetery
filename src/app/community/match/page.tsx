"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbSajuProfile } from "@/lib/community-client"
import { calculateManseryeok } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"
import { GenderSelect } from "@/components/GenderSelect"
import type { SajuProfile } from "@/types/community"

interface CommunityStats {
  total: number
  genderDist: { M: number; F: number; unknown: number }
  elementDist: Record<string, number>
  lastUpdatedAt: string
}

interface PremiumStatData {
  title: string
  items: Array<{ label: string; value: number | string; detail?: string }>
}

const ELEMENT_EMOJI: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" }
const ELEMENT_COLOR: Record<string, string> = { 목: "text-green-400", 화: "text-red-400", 토: "text-yellow-400", 금: "text-gray-300", 수: "text-blue-400" }
const ELEMENT_BAR_COLOR: Record<string, string> = { 목: "bg-green-400", 화: "bg-red-400", 토: "bg-yellow-400", 금: "bg-gray-300", 수: "bg-blue-400" }

const PREMIUM_STATS = [
  { statType: "elementTraits", title: "오행별 성격 특성", icon: "🧬" },
  { statType: "yearBranch", title: "띠(연지)별 분포", icon: "🐉" },
  { statType: "iljuDist", title: "일주 TOP 20", icon: "📊" },
  { statType: "elementCompat", title: "오행 궁합 조합", icon: "💞" },
]

function BlurAvatar({ gender }: { gender?: "M" | "F" | string }) {
  const tint = gender === "M" ? "#3b82f6" : gender === "F" ? "#ec4899" : "#a855f7"
  const bgClass = gender === "M" ? "bg-blue-500/10" : gender === "F" ? "bg-pink-500/10" : "bg-purple-500/10"

  return (
    <div className={`relative w-10 h-10 rounded-full overflow-hidden ${bgClass} flex-shrink-0`}>
      <svg viewBox="0 0 40 40" className="w-full h-full" style={{ filter: "blur(8px)" }}>
        <circle cx="20" cy="20" r="20" fill={tint} opacity="0.3" />
        <circle cx="20" cy="15" r="7" fill={tint} opacity="0.6" />
        <ellipse cx="20" cy="32" rx="11" ry="9" fill={tint} opacity="0.5" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-full" />
    </div>
  )
}

function GenderBar({ dist }: { dist: { M: number; F: number; unknown: number } }) {
  const total = dist.M + dist.F + dist.unknown
  if (total === 0) return <p className="text-xs text-cemetery-ghost/40">데이터 없음</p>

  const pctM = Math.round((dist.M / total) * 100)
  const pctF = Math.round((dist.F / total) * 100)
  const pctU = 100 - pctM - pctF

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-blue-400 w-8">♂ {dist.M}</span>
        <div className="flex-1 bg-cemetery-surface rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${pctM}%` }} />
        </div>
        <span className="text-cemetery-ghost/40 w-8 text-right">{pctM}%</span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-pink-400 w-8">♀ {dist.F}</span>
        <div className="flex-1 bg-cemetery-surface rounded-full h-1.5 overflow-hidden">
          <div className="bg-pink-400 h-full rounded-full transition-all" style={{ width: `${pctF}%` }} />
        </div>
        <span className="text-cemetery-ghost/40 w-8 text-right">{pctF}%</span>
      </div>
      {dist.unknown > 0 && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gray-400 w-8">? {dist.unknown}</span>
          <div className="flex-1 bg-cemetery-surface rounded-full h-1.5 overflow-hidden">
            <div className="bg-gray-400 h-full rounded-full transition-all" style={{ width: `${pctU}%` }} />
          </div>
          <span className="text-cemetery-ghost/40 w-8 text-right">{pctU}%</span>
        </div>
      )}
    </div>
  )
}

function ElementBars({ dist }: { dist: Record<string, number> }) {
  const elements = ["목", "화", "토", "금", "수"]
  const max = Math.max(...elements.map((e) => dist[e] || 0), 1)

  return (
    <div className="space-y-1.5">
      {elements.map((el) => {
        const count = dist[el] || 0
        const pct = Math.round((count / max) * 100)
        return (
          <div key={el} className="flex items-center gap-2 text-[11px]">
            <span className={`w-6 ${ELEMENT_COLOR[el]}`}>{el}</span>
            <div className="flex-1 bg-cemetery-surface rounded-full h-1.5 overflow-hidden">
              <div className={`${ELEMENT_BAR_COLOR[el]} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-cemetery-ghost/40 w-6 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function PremiumStatCard({
  stat,
  unlockedData,
  onUnlock,
  unlocking,
}: {
  stat: { statType: string; title: string; icon: string }
  unlockedData: PremiumStatData | null
  onUnlock: () => void
  unlocking: boolean
}) {
  if (unlockedData) {
    return (
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4 space-y-3 animate-fade-in">
        <h3 className="text-xs font-semibold text-cemetery-heading flex items-center gap-1.5">
          <span>{stat.icon}</span> {stat.title}
        </h3>
        <div className="space-y-1.5">
          {unlockedData.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-cemetery-text">{item.label}</span>
              <span className="text-cemetery-ghost/60">
                {item.detail ? `${item.value} · ${item.detail}` : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cemetery-card border border-yellow-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
      <span className="text-2xl">🔒</span>
      <p className="text-xs font-semibold text-cemetery-heading">{stat.title}</p>
      <button
        onClick={onUnlock}
        disabled={unlocking}
        className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-40 rounded-lg text-[11px] transition-colors cute-press"
      >
        {unlocking ? "로딩..." : "🪙 10 코인으로 열기"}
      </button>
    </div>
  )
}

export default function MatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || ""

  const [profile, setProfile] = useState<SajuProfile | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [gender, setGender] = useState("")
  const [mbti, setMbti] = useState("")
  const [introduction, setIntroduction] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [matches, setMatches] = useState<Array<SajuProfile & { matchScore: number }>>([])
  const [loading, setLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [error, setError] = useState("")

  // Stats
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showNewBadge, setShowNewBadge] = useState(false)

  // Premium stats
  const [unlockedStats, setUnlockedStats] = useState<Record<string, PremiumStatData>>({})
  const [unlockingType, setUnlockingType] = useState<string | null>(null)

  const hourOptions = [
    { value: "", label: "모름" },
    { value: "0", label: "자시 (23:30~01:30)" }, { value: "2", label: "축시 (01:30~03:30)" },
    { value: "4", label: "인시 (03:30~05:30)" }, { value: "6", label: "묘시 (05:30~07:30)" },
    { value: "8", label: "진시 (07:30~09:30)" }, { value: "10", label: "사시 (09:30~11:30)" },
    { value: "12", label: "오시 (11:30~13:30)" }, { value: "14", label: "미시 (13:30~15:30)" },
    { value: "16", label: "신시 (15:30~17:30)" }, { value: "18", label: "유시 (17:30~19:30)" },
    { value: "20", label: "술시 (19:30~21:30)" }, { value: "22", label: "해시 (21:30~23:30)" },
  ]

  // Fetch stats on mount
  useEffect(() => {
    dbSajuProfile.getStats()
      .then((res) => {
        const s = res.data as CommunityStats
        setStats(s)

        // N badge logic
        if (s?.lastUpdatedAt) {
          const lastSeen = localStorage.getItem("matchLastSeen")
          if (!lastSeen || lastSeen < s.lastUpdatedAt) {
            setShowNewBadge(true)
          }
          localStorage.setItem("matchLastSeen", s.lastUpdatedAt)
        }
      })
      .catch(() => { /* stats are non-critical */ })
      .finally(() => setStatsLoading(false))
  }, [])

  // Fetch profile
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) {
      dbSajuProfile.get(userId).then((res) => {
        if (res.data) {
          setProfile(res.data)
          setBirthDate(res.data.birthDate || "")
          setBirthTime(res.data.birthTime || "")
          setGender(res.data.gender || "")
          setMbti(res.data.mbti || "")
          setIntroduction(res.data.introduction || "")
          setLookingFor(res.data.lookingFor || "")
        }
      })
    }
  }, [userId, status, router])

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
      const yearBranch = result.fourPillars.year.branch
      const res = await dbSajuProfile.register(userId, userName, {
        birthDate, birthTime,
        gender: gender || undefined,
        mbti: mbti || undefined,
        ilju,
        yearBranch,
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

  const handleUnlockPremium = async (statType: string) => {
    setUnlockingType(statType)
    try {
      const res = await dbSajuProfile.getPremiumStat(statType)
      setUnlockedStats((prev) => ({ ...prev, [statType]: res.data as PremiumStatData }))
    } catch (err) {
      alert(err instanceof Error ? err.message : "프리미엄 통계 열기 실패")
    } finally {
      setUnlockingType(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
          💘 궁합 매칭
          {showNewBadge && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full align-top animate-bounce">
              N
            </span>
          )}
        </h1>
        <p className="text-xs text-cemetery-ghost/40">사주 프로필을 등록하고 잘 맞는 유령을 찾아보세요</p>
      </div>

      {/* Community Stats Dashboard */}
      {!statsLoading && stats && (
        <div className="space-y-4 animate-fade-in">
          {/* Free Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total registrants */}
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-cemetery-heading flex items-center gap-1.5">
                <span>👻</span> 전체 등록자
              </h3>
              <p className="text-2xl font-bold text-cemetery-accent">{stats.total.toLocaleString()}</p>
            </div>

            {/* Gender distribution */}
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-cemetery-heading flex items-center gap-1.5">
                <span>⚤</span> 성별 분포
              </h3>
              <GenderBar dist={stats.genderDist} />
            </div>

            {/* Element distribution */}
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-cemetery-heading flex items-center gap-1.5">
                <span>🔮</span> 오행 분포
              </h3>
              <ElementBars dist={stats.elementDist} />
            </div>
          </div>

          {/* Premium Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PREMIUM_STATS.map((stat) => (
              <PremiumStatCard
                key={stat.statType}
                stat={stat}
                unlockedData={unlockedStats[stat.statType] || null}
                onUnlock={() => handleUnlockPremium(stat.statType)}
                unlocking={unlockingType === stat.statType}
              />
            ))}
          </div>
        </div>
      )}

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
          <label className="block text-xs text-cemetery-ghost/50 mb-1">성별</label>
          <GenderSelect value={gender} onChange={setGender} />
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
                      <BlurAvatar gender={m.gender} />
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
