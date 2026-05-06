"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 해요")
      return
    }

    setLoading(true)

    try {
      const result = await signIn("credentials", {
        nickname,
        password,
        redirect: false,
      })

      if (!result) {
        setError("로그인 응답을 받지 못했습니다")
      } else if (result.error) {
        setError("닉네임 또는 비밀번호를 다시 확인해주세요")
      } else if (result.url) {
        router.push("/")
        router.refresh()
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err: unknown) {
      // NextAuth v5에서 성공 시에도 redirect 에러를 throw할 수 있음
      if (err && typeof err === "object" && "url" in err) {
        router.push("/")
        router.refresh()
        return
      }
      setError("로그인 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        {/* 묘지 입구 */}
        <div className="text-center space-y-4">
          <div className="text-6xl ghost-float">🪦</div>
          <h1 className="font-gothic text-3xl font-black text-cemetery-heading">
            묘지 출입증
          </h1>
          <p className="text-cemetery-ghost text-sm">
            닉네임과 비밀번호로 입장하세요<br />
            처음이면 자동으로 등록됩니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">묘지기 이름</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              required
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자 이상"
              required
              minLength={4}
              className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
              rounded-lg font-semibold transition-colors text-lg"
          >
            {loading ? "입장 중..." : "🚪 묘지 입장"}
          </button>

          <div className="flex justify-between text-xs text-cemetery-ghost/40">
            <a href="/register" className="hover:text-cemetery-accent transition-colors">
              👻 회원가입
            </a>
            <a href="/forgot-password" className="hover:text-cemetery-accent transition-colors">
              🔑 비밀번호 찾기
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
