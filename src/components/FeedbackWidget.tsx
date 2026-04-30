"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

const MASTER_NAME = "금빛샤인"

export function FeedbackWidget() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string; nickname: string; message: string; createdAt: string
  }>>([])

  const userName = session?.user?.name || ""
  const isMaster = userName === MASTER_NAME

  useEffect(() => {
    if (open && isMaster) {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      })
        .then((r) => r.json())
        .then((d) => setFeedbacks(d.data || []))
    }
  }, [open, isMaster])

  const handleSend = async () => {
    if (!message.trim()) return
    const userId = (session?.user as { id?: string })?.id
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", userId, nickname: userName, message: message.trim() }),
    })
    setMessage("")
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const handleDelete = async (id: string) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", message: id }),
    })
    setFeedbacks((prev) => prev.filter((f) => f.id !== id))
  }

  if (!session) return null

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-cemetery-accent
          hover:bg-cemetery-accent-dim shadow-lg shadow-cemetery-accent/30
          flex items-center justify-center text-xl transition-all cute-press
          hover:scale-110"
      >
        {open ? "✕" : "💌"}
      </button>

      {/* 패널 */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-cemetery-card border border-cemetery-border
          rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">

          <div className="px-4 py-3 border-b border-cemetery-border bg-cemetery-surface/50">
            <h3 className="text-sm font-semibold text-cemetery-heading">
              {isMaster ? "📬 받은 피드백" : "💌 개발자에게 한마디"}
            </h3>
          </div>

          {isMaster ? (
            // 마스터 뷰: 피드백 목록
            <div className="max-h-80 overflow-y-auto">
              {feedbacks.length === 0 ? (
                <p className="text-center py-8 text-cemetery-ghost/40 text-xs">아직 피드백이 없어요</p>
              ) : (
                <div className="divide-y divide-cemetery-border/50">
                  {feedbacks.map((f) => (
                    <div key={f.id} className="px-4 py-3 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] text-cemetery-accent">{f.nickname}</p>
                          <p className="text-xs text-cemetery-text mt-1">{f.message}</p>
                          <p className="text-[9px] text-cemetery-ghost/30 mt-1">
                            {new Date(f.createdAt).toLocaleString("ko-KR")}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50
                            hover:text-red-400 transition-all ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 일반 유저 뷰: 메시지 보내기
            <div className="p-4 space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="버그 신고, 기능 건의, 하고싶은 말 자유롭게..."
                rows={3}
                className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
                  text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none
                  focus:border-cemetery-accent focus:outline-none"
              />
              {sent ? (
                <p className="text-center text-xs text-cemetery-accent animate-fade-in">
                  ✨ 전달 완료! 감사합니다
                </p>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="w-full py-2 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40
                    rounded-xl text-sm font-semibold transition-colors cute-press"
                >
                  보내기
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
