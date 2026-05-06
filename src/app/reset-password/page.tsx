"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [nickname, setNickname] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!token) { setInvalid(true); setVerifying(false); return }
    fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forgotPassword.verifyToken", token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setInvalid(true)
        else setNickname(data.data.nickname)
      })
      .catch(() => setInvalid(true))
      .finally(() => setVerifying(false))
  }, [token])

  const handleReset = async () => {
    setError("")
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("8자 이상, 영문+숫자 포함"); return
    }
    if (newPassword !== newPasswordConfirm) { setError("비밀번호가 일치하지 않습니다"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.reset", token, newPassword }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setDone(true)
    } catch {
      setError("오류가 발생했습니다")
    }
    setLoading(false)
  }

  if (verifying) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl ghost-float inline-block">👻</div>
        <p className="text-cemetery-ghost mt-3">링크 확인 중...</p>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-4xl">❌</div>
        <h2 className="font-gothic text-xl text-cemetery-heading">유효하지 않은 링크</h2>
        <p className="text-sm text-cemetery-ghost">링크가 만료되었거나 이미 사용되었습니다.</p>
        <a href="/forgot-password" className="inline-block px-4 py-2 bg-cemetery-accent rounded-xl text-sm">
          다시 요청하기
        </a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-20 space-y-6 animate-fade-in">
        <div className="text-6xl ghost-float inline-block">🎉</div>
        <h2 className="font-gothic text-2xl font-bold text-cemetery-heading">부활 성공!</h2>
        <p className="text-sm text-cemetery-ghost">
          <span className="text-cemetery-accent">{nickname}</span>님의 주문이 변경되었습니다.
        </p>
        <button onClick={() => router.push("/login")}
          className="w-full max-w-xs mx-auto py-3 bg-cemetery-accent rounded-xl font-semibold cute-press block">
          🚪 다시 입장하기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="text-5xl ghost-float inline-block">🔮</div>
        <h1 className="font-gothic text-2xl font-bold text-cemetery-heading">새 주문 설정</h1>
        <p className="text-sm text-cemetery-ghost">
          <span className="text-cemetery-accent">{nickname}</span>님, 새 비밀번호를 설정하세요
        </p>
      </div>

      <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">🔮 새 주문 (8자+, 영문+숫자)</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호"
            className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
          {newPassword.length > 0 && (
            <div className="flex gap-2 mt-1">
              <span className={"text-[10px] " + (newPassword.length >= 8 ? "text-green-400" : "text-red-400")}>
                {newPassword.length >= 8 ? "✓" : "✕"} 8자+
              </span>
              <span className={"text-[10px] " + (/[a-zA-Z]/.test(newPassword) ? "text-green-400" : "text-red-400")}>
                {/[a-zA-Z]/.test(newPassword) ? "✓" : "✕"} 영문
              </span>
              <span className={"text-[10px] " + (/[0-9]/.test(newPassword) ? "text-green-400" : "text-red-400")}>
                {/[0-9]/.test(newPassword) ? "✓" : "✕"} 숫자
              </span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">🔮 주문 확인</label>
          <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder="재입력"
            className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
          {newPasswordConfirm.length > 0 && (
            <p className={"text-[10px] mt-1 " + (newPassword === newPasswordConfirm ? "text-green-400" : "text-red-400")}>
              {newPassword === newPasswordConfirm ? "✓ 일치" : "✕ 불일치"}
            </p>
          )}
        </div>
        {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
        <button type="button" onClick={handleReset} disabled={loading}
          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
          {loading ? "변경 중..." : "🔮 주문 변경 완료"}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center py-20 text-cemetery-ghost">로딩 중...</div>}>
          <ResetPasswordContent />
        </Suspense>
        <p className="text-center text-xs text-cemetery-ghost/30 mt-6">
          <a href="/login" className="hover:text-cemetery-accent transition-colors">← 로그인으로</a>
        </p>
      </div>
    </div>
  )
}
