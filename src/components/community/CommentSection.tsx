"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { dbComments } from "@/lib/community-client"
import type { Comment } from "@/types/community"

export function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || ""

  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  const reload = async () => {
    const res = await dbComments.list(postId)
    setComments(res.data || [])
  }

  useEffect(() => { reload() }, [postId])

  const handleSubmit = async () => {
    if (!input.trim() || !userId) return
    setSending(true)
    await dbComments.create(userId, { postId, nickname: userName, content: input.trim() })
    setInput("")
    setSending(false)
    reload()
  }

  const handleLike = async (commentId: string) => {
    if (!userId) return
    await dbComments.like(userId, commentId)
    reload()
  }

  const handleDelete = async (commentId: string) => {
    if (!userId || !confirm("댓글을 삭제할까요?")) return
    await dbComments.delete(userId, commentId)
    reload()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-cemetery-heading">
        👻 댓글 {comments.length}개
      </h3>

      {/* 댓글 목록 */}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-cemetery-surface rounded-xl p-3 group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-cemetery-accent">{c.nickname}</span>
                  <span className="text-[9px] text-cemetery-ghost/30">
                    {new Date(c.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <p className="text-sm text-cemetery-text">{c.content}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => handleLike(c.id)}
                  className={`text-xs transition-colors ${
                    c.likedBy?.includes(userId || "") ? "text-cemetery-accent" : "text-cemetery-ghost/30 hover:text-cemetery-ghost"
                  }`}
                >
                  👻 {c.likes || 0}
                </button>
                {c.userId === userId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-[10px] text-cemetery-ghost/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center py-6 text-cemetery-ghost/30 text-xs">아직 댓글이 없어요 👻</p>
        )}
      </div>

      {/* 댓글 작성 */}
      {userId ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder="댓글을 남겨보세요... (🪙 +3)"
            disabled={sending}
            className="flex-1 px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-full
              text-cemetery-text placeholder-cemetery-ghost/30 text-sm
              focus:border-cemetery-accent focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40
              rounded-full text-sm transition-colors cute-press"
          >
            👻
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-cemetery-ghost/30">로그인하면 댓글을 남길 수 있어요</p>
      )}
    </div>
  )
}
