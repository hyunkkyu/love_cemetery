"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Grave, GraveGrade } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { GraveCard } from "@/components/GraveCard"
import { GraveForm } from "@/components/GraveForm"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"
import { dbGraves, dbUser } from "@/lib/api-client"

const GRADE_SLOTS: Record<GraveGrade, number> = {
  national: 3,
  public: 6,
  sea: 4,
}

export default function GravePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [graves, setGraves] = useState<Grave[]>([])
  const [showForm, setShowForm] = useState(false)
  const [coins, setCoinsVal] = useState(0)

  const userId = (session?.user as { id?: string })?.id

  const reload = useCallback(async () => {
    if (!userId) return
    const [gravesData, userData] = await Promise.all([
      dbGraves.list(userId),
      dbUser.get(userId),
    ])
    setGraves(gravesData || [])
    setCoinsVal(userData?.coins || 0)
  }, [userId])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    reload()
  }, [userId, status, router, reload])

  const handleSave = async (grave: Grave) => {
    if (!userId) return
    try {
      await dbGraves.save(userId, grave as unknown as Record<string, unknown>)
      const grade = grave.grade || "public"
      const gradeInfo = GRAVE_GRADES[grade]
      if (gradeInfo) {
        await dbUser.addCoins(userId, gradeInfo.coins)
      }
      setShowForm(false)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "묘비 등록에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!userId) return
    if (!confirm("정말 이 묘비를 철거하시겠습니까?")) return
    try {
      await dbGraves.delete(userId, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.")
    }
  }

  const handleNewGrave = () => {
    if (showForm) return // 이미 폼이 열려있으면 무시
    setShowForm(true)
  }

  if (status === "loading") {
    return <div className="text-center py-20 text-cemetery-ghost">로딩 중...</div>
  }

  // 등급별 묘비 분류
  const gravesByGrade: Record<GraveGrade, Grave[]> = {
    national: graves.filter((g) => g.grade === "national"),
    public: graves.filter((g) => g.grade === "public" || !g.grade || (g.grade as string) === "private"),
    sea: graves.filter((g) => g.grade === "sea"),
  }

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
          묘지 관리
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-yellow-400 bg-cemetery-card px-3 py-1.5 rounded-full border border-yellow-500/20">
            🪙 {coins}
          </span>
        </div>
      </div>

      {/* 묘비 세우기 폼 */}
      {showForm && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-gothic text-xl text-cemetery-heading">새 묘비 등록</h2>
            <button onClick={() => setShowForm(false)} className="text-cemetery-ghost hover:text-cemetery-heading text-sm">✕ 닫기</button>
          </div>
          <p className="text-xs text-yellow-400 mb-4">
            🪙 등급별 보상: 현충원 +400 / 공동묘지 +300 / 개인묘지 +200 / 수장 +100
          </p>
          <GraveForm onSave={handleSave} />
        </div>
      )}

      {/* === 현충원 === */}
      <CemeterySection
        grade="national"
        graves={gravesByGrade.national}
        maxSlots={GRADE_SLOTS.national}
        onNewGrave={handleNewGrave}
        onDelete={handleDelete}
        showForm={showForm}
      />

      {/* === 공동묘지 === */}
      <CemeterySection
        grade="public"
        graves={gravesByGrade.public}
        maxSlots={GRADE_SLOTS.public}
        onNewGrave={handleNewGrave}
        onDelete={handleDelete}
        showForm={showForm}
      />

      {/* === 수장 === */}
      <CemeterySection
        grade="sea"
        graves={gravesByGrade.sea}
        maxSlots={GRADE_SLOTS.sea}
        onNewGrave={handleNewGrave}
        onDelete={handleDelete}
        showForm={showForm}
      />
    </div>
  )
}

// 등급별 묘지 구역 디자인
const SECTION_STYLES: Record<GraveGrade, {
  bg: string
  borderColor: string
  groundColor: string
  groundPattern: string
  headerBg: string
  description: string
  emptyIcon: string
  ambiance: string[]
}> = {
  national: {
    bg: "bg-gradient-to-b from-[#1a1520] via-[#1e1828] to-[#151020]",
    borderColor: "border-yellow-600/30",
    groundColor: "bg-gradient-to-r from-yellow-900/20 via-yellow-800/10 to-yellow-900/20",
    groundPattern: "border-t-2 border-yellow-700/30",
    headerBg: "bg-gradient-to-r from-yellow-900/30 to-transparent",
    description: "격조 높은 대리석 묘역. 잊을 수 없는 대연애만이 이곳에 잠들 수 있습니다.",
    emptyIcon: "🏛️",
    ambiance: ["🏛️", "⭐", "🕊️"],
  },
  public: {
    bg: "bg-gradient-to-b from-[#141420] via-[#161625] to-[#121218]",
    borderColor: "border-cemetery-border",
    groundColor: "bg-gradient-to-r from-green-900/10 via-cemetery-surface to-green-900/10",
    groundPattern: "border-t border-green-900/20",
    headerBg: "bg-cemetery-surface/50",
    description: "가장 보편적인 묘역. 다른 연애들과 나란히 잠듭니다.",
    emptyIcon: "🪦",
    ambiance: ["🪦", "🌿", "🕯️"],
  },
  sea: {
    bg: "bg-gradient-to-b from-[#0c1520] via-[#0e1825] to-[#0a1018]",
    borderColor: "border-blue-900/30",
    groundColor: "bg-gradient-to-r from-blue-900/15 via-blue-950/10 to-blue-900/15",
    groundPattern: "border-t border-blue-800/15",
    headerBg: "bg-blue-900/15",
    description: "바다에 흘려보내기. 묘비도 없이, 파도에 실려 사라집니다.",
    emptyIcon: "🌊",
    ambiance: ["🌊", "🐚"],
  },
}

function CemeterySection({
  grade,
  graves,
  maxSlots,
  onNewGrave,
  onDelete,
  showForm,
}: {
  grade: GraveGrade
  graves: Grave[]
  maxSlots: number
  onNewGrave: () => void
  onDelete: (id: string) => void
  showForm: boolean
}) {
  const info = GRAVE_GRADES[grade]
  const style = SECTION_STYLES[grade]
  const emptySlots = Math.max(0, maxSlots - graves.length)

  return (
    <section className={`${style.bg} ${style.borderColor} border rounded-2xl overflow-hidden`}>
      {/* 구역 헤더 */}
      <div className={`${style.headerBg} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <h2 className={`font-gothic text-lg font-bold ${info.color}`}>
              {info.name}
            </h2>
            <p className="text-[11px] text-cemetery-ghost/40">{style.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cemetery-ghost/30">
            {graves.length}기 안치
          </span>
          <span className="text-xs text-yellow-400/60">+{info.coins}🪙</span>
        </div>
      </div>

      {/* 바닥 질감 + 장식 */}
      <div className={`${style.groundColor} ${style.groundPattern} relative`}>
        {/* 분위기 장식 */}
        <div className="absolute top-2 right-4 flex gap-2 text-sm opacity-20">
          {style.ambiance.map((a, i) => (
            <span key={i} className={i === 0 ? "" : "ghost-float"} style={{ animationDelay: `${i * 0.5}s` }}>{a}</span>
          ))}
        </div>

        {/* 묘비 그리드 */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 실제 묘비들 */}
            {graves.map((grave) => (
              <div key={grave.id} className="relative group">
                <GraveCard grave={grave} />
                <button
                  onClick={() => onDelete(grave.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                    w-7 h-7 bg-red-900/80 hover:bg-red-800 rounded-full flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 빈 묘지 슬롯 */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={() => !showForm && onNewGrave()}
                className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all
                  hover:border-cemetery-ghost/30 cursor-pointer min-h-[180px] flex flex-col items-center justify-center gap-3
                  ${style.borderColor} border-opacity-20 hover:bg-white/[0.02]`}
              >
                <span className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
                  {style.emptyIcon}
                </span>
                <span className="text-[11px] text-cemetery-ghost/20 group-hover:text-cemetery-ghost/40 transition-colors">
                  빈 묘지
                </span>
                <span className="text-[10px] text-cemetery-accent/0 group-hover:text-cemetery-accent/60 transition-colors">
                  + 묘비 세우기
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
