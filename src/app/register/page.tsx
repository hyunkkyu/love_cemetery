"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const SECURITY_QUESTIONS = [
  "첫사랑의 이름은?",
  "가장 좋아하는 노래 제목은?",
  "어릴 때 살던 동네 이름은?",
  "반려동물 이름은?",
  "가장 기억에 남는 여행지는?",
  "좋아하는 음식은?",
]

export default function RegisterPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [nicknameOk, setNicknameOk] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // 닉네임 중복 체크 (디바운스)
  useEffect(() => {
    if (nickname.length < 2) { setNicknameOk(null); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkNickname", nickname }),
        })
        const data = await res.json()
        setNicknameOk(data.data?.available || false)
      } catch { setNicknameOk(null) }
    }, 500)
    return () => clearTimeout(timer)
  }, [nickname])

  const passwordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
  const passwordMatch = password === passwordConfirm && passwordConfirm.length > 0

  const handleSubmit = async () => {
    setError("")
    if (!nickname || !password || !securityAnswer) {
      setError("모든 항목을 입력해주세요")
      return
    }
    if (!nicknameOk) { setError("사용할 수 없는 닉네임입니다"); return }
    if (!passwordValid) { setError("비밀번호: 8자 이상, 영문+숫자 포함"); return }
    if (!passwordMatch) { setError("비밀번호가 일치하지 않습니다"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", nickname, password, securityQuestion, securityAnswer }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }

      // 자동 로그인
      const result = await signIn("credentials", { nickname, password, redirect: false })
      if (result?.ok) {
        router.push("/")
        router.refresh()
      } else {
        router.push("/login")
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl ghost-float inline-block">⚰️</div>
          <h1 className="font-gothic text-2xl font-black text-cemetery-heading">묘지기 등록</h1>
          <p className="text-xs text-cemetery-ghost/50">영혼의 이름과 주문을 등록하세요</p>
        </div>

        <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
          {/* 닉네임 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">👻 영혼의 이름 (2~12자, 한글/영문/숫자)</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="이 세계에서 불릴 이름" maxLength={12}
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            {nickname.length >= 2 && (
              <p className={"text-[10px] mt-1 " + (nicknameOk ? "text-green-400" : nicknameOk === false ? "text-red-400" : "text-cemetery-ghost/30")}>
                {nicknameOk ? "✓ 사용 가능" : nicknameOk === false ? "✕ 이미 사용 중" : "확인 중..."}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">🔮 입장 주문 (8자 이상, 영문+숫자)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="묘지 입장 주문"
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            {password.length > 0 && (
              <div className="flex gap-2 mt-1">
                <span className={"text-[10px] " + (password.length >= 8 ? "text-green-400" : "text-red-400")}>
                  {password.length >= 8 ? "✓" : "✕"} 8자 이상
                </span>
                <span className={"text-[10px] " + (/[a-zA-Z]/.test(password) ? "text-green-400" : "text-red-400")}>
                  {/[a-zA-Z]/.test(password) ? "✓" : "✕"} 영문
                </span>
                <span className={"text-[10px] " + (/[0-9]/.test(password) ? "text-green-400" : "text-red-400")}>
                  {/[0-9]/.test(password) ? "✓" : "✕"} 숫자
                </span>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">🔮 주문 확인</label>
            <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="주문 다시 입력"
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
            {passwordConfirm.length > 0 && (
              <p className={"text-[10px] mt-1 " + (passwordMatch ? "text-green-400" : "text-red-400")}>
                {passwordMatch ? "✓ 일치" : "✕ 불일치"}
              </p>
            )}
          </div>

          {/* 보안 질문 */}
          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">🕯️ 영혼 확인 질문 (주문 분실 시 사용)</label>
            <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text focus:border-cemetery-accent focus:outline-none text-sm">
              {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-cemetery-ghost/50 mb-1">🕯️ 답변</label>
            <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="유령만 아는 답"
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">⚠️ {error}</p>
          )}

          <button type="button" onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50 rounded-xl font-semibold transition-colors cute-press text-lg">
            {loading ? "등록 중..." : "⚰️ 묘지기 등록"}
          </button>

          <p className="text-center text-xs text-cemetery-ghost/40">
            이미 계정이 있나요? <a href="/login" className="text-cemetery-accent hover:underline">로그인</a>
          </p>
        </div>
      </div>
    </div>
  )
}
