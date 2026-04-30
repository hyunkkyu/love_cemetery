"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { dbPartner, dbGraveComment } from "@/lib/partner-client"
import { GRAVE_GRADES } from "@/types"
import type { Grave } from "@/types"

interface GComment { id: string; nickname: string; content: string; userId: string; createdAt: string }

export default function PartnerGravesPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = use(params)
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id

  const [graves, setGraves] = useState<Grave[]>([])
  const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null)
  const [comments, setComments] = useState<GComment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [sending, setSending] = useState(false)
  const [partnerName, setPartnerName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) return
    loadGraves()
  }, [userId, partnerId])

  const loadGraves = async () => {
    try {
      const res = await dbPartner.graves(partnerId)
      setGraves(res.data || [])
      if (res.data && res.data.length > 0) {
        setPartnerName(res.data[0]?.nickname || "동반자")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "묘비를 불러올 수 없습니다")
    }
  }

  const handleSelectGrave = async (grave: Grave) => {
    setSelectedGrave(grave)
    try {
      const res = await dbGraveComment.list(grave.id)
      setComments(res.data || [])
    } catch { setComments([]) }
  }

  const handleComment = async () => {
    if (!commentInput.trim() || !selectedGrave || !userId) return
    setSending(true)
    try {
      await dbGraveComment.create(selectedGrave.id, partnerId, commentInput.trim())
      setCommentInput("")
      const res = await dbGraveComment.list(selectedGrave.id)
      setComments(res.data || [])
    } catch (err) {
      alert(err instanceof Error ? err.message : "코멘트 작성 실패")
    }
    setSending(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await dbGraveComment.delete(commentId)
      const res = await dbGraveComment.list(selectedGrave!.id)
      setComments(res.data || [])
    } catch { /* ignore */ }
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-400">{error}</p>
        <a href="/partner" className="text-cemetery-accent text-sm">← 돌아가기</a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/partner" className="text-cemetery-ghost hover:text-cemetery-heading">←</a>
        <h1 className="font-gothic text-2xl text-cemetery-heading">
          👻 {partnerName || "동반자"}의 묘지
        </h1>
      </div>

      {/* 묘비 목록 */}
      {graves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {graves.map((g) => {
            const gradeInfo = GRAVE_GRADES[(g.grade || "public") as keyof typeof GRAVE_GRADES]
            const isSelected = selectedGrave?.id === g.id
            return (
              <button key={g.id} onClick={() => handleSelectGrave(g)}
                className={"text-left bg-cemetery-card border rounded-2xl p-4 transition-all tombstone-hover " +
                  (isSelected ? "border-cemetery-accent ring-1 ring-cemetery-accent/30" : "border-cemetery-border")}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{gradeInfo?.emoji || "🪦"}</span>
                  <span className={"text-xs " + (gradeInfo?.color || "")}>{gradeInfo?.name || "공동묘지"}</span>
                </div>
                {g.photo && (
                  <img src={g.photo} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 grayscale-[30%]" />
                )}
                <p className="font-gothic text-lg text-cemetery-heading text-center">{g.nickname}</p>
                <p className="text-[10px] text-cemetery-ghost/40 text-center mt-1">
                  {g.relationshipStart || "?"} — {g.relationshipEnd || "?"}
                </p>
                {g.epitaph && (
                  <p className="text-xs text-cemetery-ghost/50 italic text-center mt-2 line-clamp-1">
                    &ldquo;{g.epitaph}&rdquo;
                  </p>
                )}
                {g.compatibility && (
                  <p className="text-xs text-cemetery-accent text-center mt-1">궁합 {g.compatibility.score}%</p>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-cemetery-ghost/30">
          <span className="text-3xl">🪦</span>
          <p className="text-sm mt-2">아직 등록된 묘비가 없어요</p>
        </div>
      )}

      {/* 선택된 묘비 상세 + 코멘트 */}
      {selectedGrave && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <h3 className="font-gothic text-xl text-cemetery-heading text-center">
            {selectedGrave.nickname}의 묘비
          </h3>

          {selectedGrave.causeOfDeath && (
            <p className="text-xs text-cemetery-ghost/50 text-center">사인: {selectedGrave.causeOfDeath}</p>
          )}
          {selectedGrave.graveReason && (
            <div className="bg-cemetery-surface rounded-xl p-3">
              <p className="text-[10px] text-cemetery-ghost/40 mb-1">📝 묻힌 사연</p>
              <p className="text-sm text-cemetery-text">{selectedGrave.graveReason}</p>
            </div>
          )}
          {selectedGrave.epitaph && (
            <p className="text-center text-cemetery-ghost italic">&ldquo;{selectedGrave.epitaph}&rdquo;</p>
          )}

          {/* 궁합 정보 */}
          {selectedGrave.compatibility && (
            <div className="text-center">
              <p className="text-3xl font-bold text-cemetery-accent">{selectedGrave.compatibility.score}%</p>
              <p className="text-xs text-cemetery-ghost/40">{selectedGrave.compatibility.elementHarmony}</p>
            </div>
          )}

          {/* 코멘트 섹션 */}
          <div className="border-t border-cemetery-border pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-cemetery-heading">💬 조언 코멘트 ({comments.length})</h4>

            {comments.map((c) => (
              <div key={c.id} className="bg-cemetery-surface rounded-xl p-3 group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-cemetery-accent">{c.nickname}</span>
                    <span className="text-[9px] text-cemetery-ghost/30 ml-2">
                      {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <p className="text-sm text-cemetery-text mt-1">{c.content}</p>
                  </div>
                  {c.userId === userId && (
                    <button onClick={() => handleDeleteComment(c.id)}
                      className="text-[10px] text-cemetery-ghost/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-cemetery-ghost/30 text-xs py-3">아직 코멘트가 없어요</p>
            )}

            {/* 코멘트 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleComment() } }}
                placeholder="조언이나 응원을 남겨주세요... (🪙 +5)"
                disabled={sending}
                className="flex-1 px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
                  text-cemetery-text placeholder-cemetery-ghost/30 text-sm
                  focus:border-cemetery-accent focus:outline-none disabled:opacity-50"
              />
              <button onClick={handleComment} disabled={sending || !commentInput.trim()}
                className="px-4 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40
                  rounded-xl text-sm transition-colors cute-press">
                💬
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
