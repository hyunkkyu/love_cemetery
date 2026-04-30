"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

export function SessionGuard() {
  const { data: session, status } = useSession()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return

    // 세션은 있지만 서버에서 인증이 유효한지 확인
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.get" }),
    })
      .then((res) => {
        if (res.status === 401) {
          setShowWarning(true)
        }
      })
      .catch(() => {})
  }, [session, status])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in">
        <div className="text-center">
          <span className="text-4xl inline-block mb-3">⚠️</span>
          <h2 className="font-gothic text-lg text-cemetery-heading font-bold">
            세션이 만료되었습니다
          </h2>
          <p className="text-sm text-cemetery-ghost mt-2">
            보안 업데이트로 인해 다시 로그인이 필요합니다.
            <br />
            기존 닉네임과 비밀번호로 다시 입장해주세요.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl
            font-semibold transition-colors cute-press"
        >
          🚪 다시 로그인하기
        </button>
      </div>
    </div>
  )
}
