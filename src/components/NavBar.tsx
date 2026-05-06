"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const NAV_LINKS = [
  { href: "/grave", label: "🪦 묘지 관리" },
  { href: "/manseryeok", label: "🔮 만세력" },
  { href: "/compare", label: "⚖️ 비교 분석" },
  { href: "/partner", label: "💀 동반자" },
  { href: "/community", label: "👻 커뮤니티" },
  { href: "/stats", label: "📊 통계" },
  { href: "/ssum", label: "💔 썸붕" },
  { href: "/love", label: "💘 살랑살랑", pink: true },
  { href: "/counsel", label: "🧙 상담" },
  { href: "/shop", label: "🛒 상점" },
  { href: "/invite", label: "🎁 초대" },
  { href: "/notice", label: "📢 공지" },
]

export function NavBar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="border-b border-cemetery-border bg-cemetery-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🪦</span>
          <span className="font-gothic text-lg font-bold text-cemetery-heading">
            명예의전당
          </span>
        </a>

        {/* 데스크톱 메뉴 */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}
              className={link.pink
                ? "text-pink-300/70 hover:text-pink-300 transition-colors"
                : "text-cemetery-ghost hover:text-cemetery-heading transition-colors"}>
              {link.label}
            </a>
          ))}
          <AuthButton session={session} status={status} router={router} />
        </div>

        {/* 모바일 햄버거 */}
        <div className="lg:hidden flex items-center gap-3">
          <AuthButton session={session} status={status} router={router} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg
              bg-cemetery-card border border-cemetery-border"
          >
            <span className={"block w-4 h-0.5 bg-cemetery-ghost transition-all " + (menuOpen ? "rotate-45 translate-y-1" : "")} />
            <span className={"block w-4 h-0.5 bg-cemetery-ghost transition-all " + (menuOpen ? "opacity-0" : "")} />
            <span className={"block w-4 h-0.5 bg-cemetery-ghost transition-all " + (menuOpen ? "-rotate-45 -translate-y-1" : "")} />
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="lg:hidden border-t border-cemetery-border bg-cemetery-surface/95 backdrop-blur-sm animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className={"block px-3 py-2.5 rounded-xl text-sm transition-colors " +
                  (link.pink
                    ? "text-pink-300 bg-pink-500/10"
                    : "text-cemetery-text bg-cemetery-card hover:bg-cemetery-card/80")}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

function AuthButton({ session, status, router }: {
  session: ReturnType<typeof useSession>["data"]
  status: string
  router: ReturnType<typeof useRouter>
}) {
  if (status === "loading") return <span className="text-cemetery-ghost/40 text-xs">...</span>

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-cemetery-accent text-xs hidden sm:inline">
          👻 {session.user.name}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-2.5 py-1 text-xs bg-cemetery-card border border-cemetery-border
            hover:border-red-500/50 rounded-lg transition-colors"
        >
          퇴장
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => router.push("/login")}
      className="px-3 py-1 text-xs bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-lg transition-colors"
    >
      입장
    </button>
  )
}
