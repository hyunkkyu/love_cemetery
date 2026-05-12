"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Grave, GraveGrade } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { GraveCard } from "@/components/GraveCard"
import { GraveForm } from "@/components/GraveForm"
import { dbGraves, dbUser } from "@/lib/api-client"

export default function GravePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [graves, setGraves] = useState<Grave[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GraveGrade | null>(null)
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
      setShowModal(false)
      setSelectedGrade(null)
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

  const closeModal = () => {
    setShowModal(false)
    setSelectedGrade(null)
  }

  if (status === "loading") {
    return <div className="text-center py-20 text-cemetery-ghost">로딩 중...</div>
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
          묘지 관리
        </h1>
        <span className="text-xs text-yellow-400 bg-cemetery-card px-3 py-1.5 rounded-full border border-yellow-500/20">
          🪙 {coins}
        </span>
      </div>

      {/* 묘비 세우기 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-4 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-2xl
          font-gothic text-lg font-bold transition-colors cute-press"
      >
        🪦 묘비 세우기
      </button>

      {/* 기존 묘비 리스트 */}
      {graves.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-gothic text-lg text-cemetery-heading">안치된 묘비</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graves.map((grave) => (
                <div key={grave.id} className="relative group">
                  <GraveCard grave={grave} />
                  <button
                    onClick={() => handleDelete(grave.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                      w-7 h-7 bg-red-900/80 hover:bg-red-800 rounded-full flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
            ))}
          </div>
        </div>
      )}

      {graves.length === 0 && (
        <p className="text-center text-cemetery-ghost/50 text-sm py-10">
          아직 등록된 묘비가 없습니다. 위 버튼을 눌러 첫 묘비를 세워보세요.
        </p>
      )}

      {/* Full screen modal */}
      {showModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" onClick={closeModal} />

          {/* Modal card */}
          <div className="relative w-full max-w-lg mx-auto bg-cemetery-card border border-cemetery-border rounded-2xl
            max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-cemetery-card border-b border-cemetery-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-gothic text-xl text-cemetery-heading">
                {selectedGrade ? "새 묘비 등록" : "어디에 묻어버리시겠습니까?"}
              </h2>
              <button
                onClick={closeModal}
                className="text-cemetery-ghost hover:text-cemetery-heading text-sm"
              >
                ✕ 닫기
              </button>
            </div>

            <div className="p-6">
              {/* Step 0: Grade selection */}
              {!selectedGrade && (
                <div className="space-y-4">
                  {(Object.entries(GRAVE_GRADES) as [GraveGrade, (typeof GRAVE_GRADES)[GraveGrade]][]).map(
                    ([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedGrade(key)}
                        className="w-full p-5 rounded-xl border border-cemetery-border bg-cemetery-surface
                          hover:border-cemetery-accent text-left transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{info.emoji}</span>
                          <div className="flex-1">
                            <div className={`text-lg font-gothic font-bold ${info.color}`}>
                              {info.name}
                            </div>
                            <p className="text-xs text-cemetery-ghost/60 mt-1">{info.description}</p>
                            <span className="text-xs text-yellow-400 mt-2 inline-block">
                              🪙 +{info.coins}/묘비
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Grave form after grade selected */}
              {selectedGrade && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGrade(null)}
                      className="text-sm text-cemetery-ghost hover:text-cemetery-heading"
                    >
                      ← 등급 다시 선택
                    </button>
                  </div>
                  <GraveForm onSave={handleSave} initialGrade={selectedGrade} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
