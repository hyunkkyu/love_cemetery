"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"

interface NavGroup {
  label: string
  items: { href: string; label: string; desc: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "🪦 묘지",
    items: [
      { href: "/grave", label: "🪦 묘지 관리", desc: "묘비 등록/관리" },
      { href: "/compare", label: "⚖️ 비교 분석", desc: "두 묘비 비교" },
      { href: "/partner", label: "💀 동반자", desc: "서로 묘비 열람" },
    ],
  },
  {
    label: "🔮 분석",
    items: [
      { href: "/manseryeok", label: "🔮 운명 분석", desc: "6학문 교차검증" },
      { href: "/love", label: "💘 살랑살랑", desc: "현재 썸/연애 분석" },
      { href: "/ssum", label: "💔 썸붕", desc: "썸붕 원인 분석" },
    ],
  },
  {
    label: "👻 소셜",
    items: [
      { href: "/community", label: "👻 커뮤니티", desc: "연애토크/사주해석" },
      { href: "/stats", label: "📊 통계", desc: "랭킹/MBTI/일주" },
      { href: "/invite", label: "🎁 초대", desc: "친구 초대 +200코인" },
    ],
  },
]

const QUICK_LINKS = [
  { href: "/shop", label: "🛒" },
  { href: "/notice", label: "📢" },
]

// 모바일용 전체 링크 (부제 추가)
const ALL_LINKS = [
  { href: "/grave", label: "🪦 묘비 등록", sub: "과거 연애 묻기" },
  { href: "/manseryeok", label: "🔮 운명 분석", sub: "사주/점성 교차검증" },
  { href: "/love", label: "💘 살랑살랑", sub: "현재 썸 궁합" },
  { href: "/ssum", label: "💔 썸붕 분석", sub: "썸 깨진 이유" },
  { href: "/compare", label: "⚖️ 비교 분석", sub: "묘비 둘 비교" },
  { href: "/partner", label: "💀 동반자", sub: "서로 묘비 열람" },
  { href: "/community", label: "👻 커뮤니티", sub: "연애토크" },
  { href: "/stats", label: "📊 통계", sub: "랭킹/MBTI" },
  { href: "/shop", label: "🛒 상점", sub: "아이템 구매" },
  { href: "/invite", label: "🎁 초대", sub: "+200코인" },
  { href: "/notice", label: "📢 공지", sub: "업데이트" },
]

export function NavBar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const BOTTOM_TABS = [
    { href: "/", icon: "\u{1F3E0}", label: "\uD648" },
    { href: "/grave", icon: "\u{1FAA6}", label: "\uBB18\uBE44" },
    { href: "/manseryeok", icon: "\u{1F52E}", label: "\uBD84\uC11D" },
    { href: null, icon: "\u2022\u2022\u2022", label: "\uB354\uBCF4\uAE30" },
  ] as const

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <>
    <nav className="border-b border-cemetery-border bg-cemetery-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🪦</span>
          <span className="font-gothic text-lg font-bold text-cemetery-heading">명예의전당</span>
        </a>

        {/* 데스크톱 메뉴 */}
        <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="relative">
              <button
                onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                className={"px-3 py-1.5 rounded-lg text-sm transition-colors " +
                  (openGroup === group.label ? "bg-cemetery-card text-cemetery-heading" : "text-cemetery-ghost hover:text-cemetery-heading")}
              >
                {group.label}
              </button>

              {openGroup === group.label && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-cemetery-card border border-cemetery-border rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                  {group.items.map((item) => (
                    <a key={item.href} href={item.href}
                      onClick={() => setOpenGroup(null)}
                      className="block px-4 py-2.5 hover:bg-cemetery-surface/50 transition-colors">
                      <p className="text-sm text-cemetery-heading">{item.label}</p>
                      <p className="text-[10px] text-cemetery-ghost/40">{item.desc}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 퀵 링크 */}
          {QUICK_LINKS.map((link) => (
            <a key={link.href} href={link.href}
              className="px-2 py-1.5 text-sm text-cemetery-ghost hover:text-cemetery-heading transition-colors">
              {link.label}
            </a>
          ))}

          <AuthButton session={session} status={status} router={router} />
        </div>

        {/* 모바일: 햄버거 제거, AuthButton만 표시 */}
        <div className="lg:hidden flex items-center gap-3">
          <AuthButton session={session} status={status} router={router} />
        </div>
      </div>

    </nav>

    {/* 모바일 더보기 드롭다운 (nav 밖, 바텀 탭 위에 표시) */}
    {menuOpen && (
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-[200] border-t border-cemetery-border bg-cemetery-surface/98 backdrop-blur-md animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-3 gap-2">
          {ALL_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="block px-2 py-2.5 rounded-xl text-center text-cemetery-text bg-cemetery-card hover:bg-cemetery-card/80 transition-colors">
              <span className="block text-xs font-medium">{link.label}</span>
              <span className="block text-[10px] text-cemetery-ghost/40 mt-0.5">{link.sub}</span>
            </a>
          ))}
        </div>
      </div>
    )}

    {/* 모바일 바텀 탭 바 */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-cemetery-surface/98 backdrop-blur-md border-t border-cemetery-border">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_TABS.map((tab) => {
          const isMore = tab.href === null
          const isActive = isMore
            ? menuOpen
            : pathname === tab.href

          return (
            <button
              key={tab.label}
              onClick={() => {
                if (isMore) {
                  setMenuOpen((prev) => !prev)
                } else {
                  setMenuOpen(false)
                  router.push(tab.href as string)
                }
              }}
              className={
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors " +
                (isActive ? "text-cemetery-accent" : "text-cemetery-ghost/50")
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
    </>
  )
}

function AuthButton({ session, status, router }: {
  session: ReturnType<typeof useSession>["data"]; status: string; router: ReturnType<typeof useRouter>
}) {
  if (status === "loading") return <span className="text-cemetery-ghost/40 text-xs">...</span>
  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <CoinBadge />
        <a href="/mypage" className="text-cemetery-accent text-xs hidden sm:inline hover:underline">👻 {session.user.name}</a>
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="px-2.5 py-1 text-xs bg-cemetery-card border border-cemetery-border hover:border-red-500/50 rounded-lg transition-colors">
          퇴장
        </button>
      </div>
    )
  }
  return (
    <button onClick={() => router.push("/login")}
      className="px-3 py-1 text-xs bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-lg transition-colors">
      입장
    </button>
  )
}

function CoinBadge() {
  const [coins, setCoins] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "user.get" }),
    }).then(r => r.json()).then(d => setCoins(d.data?.coins ?? null)).catch(() => {})
  }, [])

  if (coins === null) return null

  return (
    <a href="/mypage" className="text-yellow-400 text-xs font-bold hover:text-yellow-300 transition-colors">
      🪙 {coins.toLocaleString()}
    </a>
  )
}
