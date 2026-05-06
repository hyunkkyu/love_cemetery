"use client"

import { useState } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [ghostPhase, setGhostPhase] = useState(0)

  const handleSend = async () => {
    if (!email.trim()) return
    setError("")
    setLoading(true)

    // 소환 애니메이션
    setGhostPhase(1)
    await new Promise((r) => setTimeout(r, 1200))
    setGhostPhase(2)
    await new Promise((r) => setTimeout(r, 800))

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.sendEmail", email: email.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setGhostPhase(0)
      } else {
        setGhostPhase(3)
        await new Promise((r) => setTimeout(r, 500))
        setSent(true)
      }
    } catch {
      setError("발송 중 오류가 발생했습니다")
      setGhostPhase(0)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {!sent ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className={"text-6xl inline-block transition-all duration-1000 " +
                (ghostPhase === 0 ? "opacity-50" :
                 ghostPhase === 1 ? "opacity-70 animate-bounce" :
                 ghostPhase === 2 ? "opacity-90 ghost-float" : "opacity-100")}>
                {ghostPhase === 0 ? "⚰️" : ghostPhase === 1 ? "💀" : ghostPhase === 2 ? "👻" : "💌"}
              </div>
              <h1 className="font-gothic text-2xl font-black text-cemetery-heading">
                {ghostPhase === 0 ? "영혼 소환" :
                 ghostPhase === 1 ? "무덤을 찾고 있어요..." :
                 ghostPhase === 2 ? "유령 편지를 쓰는 중..." : "발송 중..."}
              </h1>
              <p className="text-xs text-cemetery-ghost/50">
                등록한 이메일로 비밀번호 재설정 링크를 보내드려요
              </p>
            </div>

            {ghostPhase === 0 && (
              <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
                <div>
                  <label className="block text-xs text-cemetery-ghost/50 mb-1">📧 가입할 때 사용한 이메일</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" inputMode="email"
                    className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
                </div>
                {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
                <button type="button" onClick={handleSend} disabled={loading || !email.trim()}
                  className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
                  💌 유령 편지 보내기
                </button>
              </div>
            )}

            {ghostPhase > 0 && !sent && (
              <div className="text-center py-4">
                <div className="flex justify-center gap-2">
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl ghost-float inline-block">💌</div>
            <div>
              <h1 className="font-gothic text-2xl font-black text-cemetery-heading">유령 편지 발송 완료!</h1>
              <p className="text-sm text-cemetery-ghost mt-3">
                <span className="text-cemetery-accent">{email}</span> 으로<br />
                비밀번호 재설정 링크를 보냈어요.
              </p>
              <p className="text-xs text-cemetery-ghost/40 mt-2">
                메일이 안 보이면 스팸함도 확인해주세요.<br />
                링크는 1시간 동안만 유효합니다.
              </p>
            </div>
            <button onClick={() => { setSent(false); setGhostPhase(0); setEmail("") }}
              className="w-full py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-sm text-cemetery-ghost transition-colors">
              다시 보내기
            </button>
          </div>
        )}

        <p className="text-center text-xs text-cemetery-ghost/30">
          <a href="/login" className="hover:text-cemetery-accent transition-colors">← 로그인으로</a>
        </p>
      </div>
    </div>
  )
}
