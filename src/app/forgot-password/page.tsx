"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"nickname" | "answer" | "done">("nickname")
  const [nickname, setNickname] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleFindQuestion = async () => {
    if (!nickname.trim()) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.getQuestion", nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setQuestion(data.data.question)
      setStep("answer")
    } catch {
      setError("오류가 발생했습니다")
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setError("")
    if (!answer.trim()) { setError("답변을 입력해주세요"); return }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("새 비밀번호: 8자 이상, 영문+숫자 포함"); return
    }
    if (newPassword !== newPasswordConfirm) { setError("비밀번호가 일치하지 않습니다"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.verify", nickname, answer: answer.trim(), newPassword }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setStep("done")
    } catch {
      setError("오류가 발생했습니다")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">🔑</div>
          <h1 className="font-gothic text-2xl font-bold text-cemetery-heading">비밀번호 찾기</h1>
        </div>

        {step === "nickname" && (
          <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">닉네임</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                placeholder="가입할 때 사용한 닉네임"
                className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            </div>
            {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
            <button type="button" onClick={handleFindQuestion} disabled={loading || !nickname.trim()}
              className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
              {loading ? "확인 중..." : "다음 →"}
            </button>
          </div>
        )}

        {step === "answer" && (
          <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
            <div className="bg-cemetery-surface rounded-xl p-4">
              <p className="text-[10px] text-cemetery-ghost/40 mb-1">보안 질문</p>
              <p className="text-sm text-cemetery-heading">{question}</p>
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">답변</label>
              <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
                placeholder="보안 질문의 답변"
                className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">새 비밀번호 (8자 이상, 영문+숫자)</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-cemetery-ghost/50 mb-1">새 비밀번호 확인</label>
              <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="새 비밀번호 재입력"
                className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            </div>
            {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
            <button type="button" onClick={handleResetPassword} disabled={loading}
              className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <p className="text-cemetery-heading">비밀번호가 변경되었습니다!</p>
            <button onClick={() => router.push("/login")}
              className="w-full py-3 bg-cemetery-accent rounded-xl font-semibold transition-colors cute-press">
              로그인하러 가기
            </button>
          </div>
        )}

        <p className="text-center text-xs text-cemetery-ghost/30">
          <a href="/login" className="hover:text-cemetery-accent">← 로그인으로</a>
        </p>
      </div>
    </div>
  )
}
