"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function InvitePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [myCode, setMyCode] = useState("")
  const [inviteCount, setInviteCount] = useState(0)
  const [inputCode, setInputCode] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) loadCode()
  }, [userId, status, router])

  const loadCode = async () => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite.getCode" }),
      })
      const data = await res.json()
      if (data.data) {
        setMyCode(data.data.inviteCode || "")
        setInviteCount(data.data.inviteCount || 0)
      }
    } catch { /* ignore */ }
  }

  const handleApply = async () => {
    if (!inputCode.trim()) return
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite.apply", code: inputCode.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
        setMessageType("error")
      } else {
        setMessage("🎉 초대 코드 적용! 200코인이 지급되었어요!")
        setMessageType("success")
        setInputCode("")
      }
    } catch {
      setMessage("오류가 발생했습니다")
      setMessageType("error")
    }
    setTimeout(() => setMessage(""), 5000)
  }

  const handleCopyCode = () => {
    const text = "명예의전당에서 같이 연애 분석하자! 🔮\n초대 코드: " + myCode + "\n가입하고 코드 입력하면 둘 다 200코인! 🪙\nhttps://love-cemetery.vercel.app"
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setMessage("초대 메시지가 복사되었어요!")
    setMessageType("success")
    setTimeout(() => setMessage(""), 3000)
  }

  if (status === "loading") return null

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl ghost-float inline-block">🎁</div>
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">친구 초대</h1>
        <p className="text-sm text-cemetery-ghost">친구를 초대하면 둘 다 200코인!</p>
      </div>

      {/* 내 초대 코드 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-cemetery-heading">🎫 내 초대 코드</h2>
        <div className="bg-cemetery-surface rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cemetery-accent tracking-widest">{myCode || "..."}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-cemetery-surface rounded-xl p-3">
            <p className="text-[10px] text-cemetery-ghost/40">초대한 친구</p>
            <p className="text-lg font-bold text-cemetery-heading">{inviteCount}명</p>
          </div>
          <div className="bg-cemetery-surface rounded-xl p-3">
            <p className="text-[10px] text-cemetery-ghost/40">받은 보상</p>
            <p className="text-lg font-bold text-yellow-400">🪙 {inviteCount * 200}</p>
          </div>
        </div>
        <button onClick={handleCopyCode}
          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors cute-press">
          📋 초대 메시지 복사하기
        </button>
      </div>

      {/* 초대 코드 입력 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-cemetery-heading">✨ 초대 코드 입력</h2>
        <p className="text-[10px] text-cemetery-ghost/40">친구에게 받은 코드를 입력하면 200코인!</p>
        <div className="flex gap-2">
          <input type="text" value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApply() } }}
            placeholder="초대 코드 입력"
            maxLength={10}
            className="flex-1 px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 text-sm text-center tracking-widest focus:border-cemetery-accent focus:outline-none" />
          <button onClick={handleApply} disabled={!inputCode.trim()}
            className="px-4 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl text-sm transition-colors cute-press">
            적용
          </button>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={"rounded-xl p-3 text-center text-sm animate-fade-in " +
          (messageType === "success" ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400")}>
          {message}
        </div>
      )}
    </div>
  )
}
