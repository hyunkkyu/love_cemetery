"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CoinLogItem { id: string; amount: number; reason: string; balance: number; createdAt: string }
interface MyStats {
  coins: number; inviteCount: number
  graveCount: number; postCount: number; commentCount: number
  ssumCount: number
  graveRank: number | string; totalUsers: number
}

async function callData(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  })
  const text = await res.text()
  if (!text) return null
  const json = JSON.parse(text)
  return json.data
}

export default function MyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [stats, setStats] = useState<MyStats | null>(null)
  const [coinLog, setCoinLog] = useState<CoinLogItem[]>([])
  const [showLog, setShowLog] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) {
      callData("mypage.stats").then(setStats)
      callData("mypage.coinLog").then((d) => setCoinLog(d || []))
    }
  }, [userId, status, router])

  if (status === "loading") return null
  if (!session?.user) return null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 프로필 헤더 */}
      <div className="text-center space-y-3">
        <div className="text-5xl ghost-float inline-block">👻</div>
        <h1 className="font-gothic text-2xl font-bold text-cemetery-heading">
          {session.user.name}
        </h1>
        <p className="text-xs text-cemetery-ghost/40">마이페이지</p>
      </div>

      {/* 코인 + 핵심 스탯 */}
      {stats && (
        <>
          <div className="bg-cemetery-card border border-yellow-500/20 rounded-2xl p-5 text-center">
            <p className="text-[10px] text-cemetery-ghost/40">보유 코인</p>
            <p className="text-4xl font-black text-yellow-400 mt-1">🪙 {stats.coins.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard label="묘비" value={String(stats.graveCount)} icon="🪦" />
            <StatCard label="묘비 랭킹" value={typeof stats.graveRank === "number" ? stats.graveRank + "등" : "-"} icon="🏆" />
            <StatCard label="초대한 친구" value={String(stats.inviteCount)} icon="🎁" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="글" value={stats.postCount} />
            <MiniStat label="댓글" value={stats.commentCount} />
            <MiniStat label="썸붕" value={stats.ssumCount} />
          </div>
        </>
      )}

      {/* 코인 내역 */}
      <div className="space-y-3">
        <button onClick={() => setShowLog(!showLog)}
          className="w-full py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-sm text-cemetery-ghost hover:text-cemetery-heading transition-colors">
          🪙 코인 내역 ({coinLog.length}건) {showLog ? "▲" : "▼"}
        </button>

        {showLog && (
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden animate-fade-in">
            {coinLog.length > 0 ? coinLog.map((log) => (
              <div key={log.id} className="px-4 py-3 border-b border-cemetery-border/30 last:border-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-cemetery-text">{log.reason}</p>
                  <p className="text-[10px] text-cemetery-ghost/30">
                    {new Date(log.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={"text-sm font-bold " + (log.amount > 0 ? "text-green-400" : "text-red-400")}>
                    {log.amount > 0 ? "+" : ""}{log.amount}
                  </p>
                  <p className="text-[10px] text-cemetery-ghost/30">잔액 {log.balance}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-6 text-cemetery-ghost/30 text-xs">아직 내역이 없어요</p>
            )}
          </div>
        )}
      </div>

      {/* 바로가기 */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/invite" className="py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-center text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
          🎁 친구 초대
        </a>
        <a href="/shop" className="py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-center text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
          🛒 상점
        </a>
        <a href="/forgot-password" className="py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-center text-xs text-cemetery-ghost hover:border-cemetery-accent transition-colors">
          🔑 비밀번호 변경
        </a>
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="py-3 bg-cemetery-card border border-cemetery-border rounded-2xl text-xs text-red-400/60 hover:border-red-500/30 transition-colors">
          🚪 로그아웃
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-lg font-bold text-cemetery-heading mt-1">{value}</p>
      <p className="text-[10px] text-cemetery-ghost/40">{label}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-cemetery-surface rounded-xl p-2 text-center">
      <p className="text-sm font-bold text-cemetery-heading">{value}</p>
      <p className="text-[9px] text-cemetery-ghost/40">{label}</p>
    </div>
  )
}
