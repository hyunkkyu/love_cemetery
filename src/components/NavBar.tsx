"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function NavBar() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <nav className="border-b border-cemetery-border bg-cemetery-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🪦</span>
          <span className="font-gothic text-lg font-bold text-cemetery-heading">
            명예의전당
          </span>
        </a>

        <div className="flex items-center gap-6 text-sm">
          <a href="/grave" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            묘지 관리
          </a>
          <a href="/manseryeok" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            만세력
          </a>
          <a href="/compare" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            비교 분석
          </a>
          <a href="/partner" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            💀 동반자
          </a>
          <a href="/community" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            👻 커뮤니티
          </a>
          <a href="/stats" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            📊 통계
          </a>
          <a href="/love" className="text-pink-300/70 hover:text-pink-300 transition-colors">
            💘 살랑살랑
          </a>
          <a href="/counsel" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            🧙 상담
          </a>
          <a href="/shop" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            🛒 상점
          </a>
          <a href="/notice" className="text-cemetery-ghost hover:text-cemetery-heading transition-colors">
            📢
          </a>

          {status === "loading" ? (
            <span className="text-cemetery-ghost/40 text-xs">...</span>
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-cemetery-accent text-xs">
                👻 {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1 text-xs bg-cemetery-card border border-cemetery-border
                  hover:border-red-500/50 rounded-lg transition-colors"
              >
                퇴장
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-1 text-xs bg-cemetery-accent hover:bg-cemetery-accent-dim
                rounded-lg transition-colors"
            >
              입장
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
