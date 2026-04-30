"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbPartner } from "@/lib/partner-client"

interface Partner { id: string; partnerId: string; partnerNickname: string }
interface Request { id: string; fromUserId: string; fromNickname: string }
interface UserProfile { id: string; userId: string; nickname: string; dominantElement: string; mbti: string }

const ELEMENT_EMOJI: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" }

export default function PartnerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [partners, setPartners] = useState<Partner[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (userId) reload()
  }, [userId, status, router])

  const reload = async () => {
    try {
      const [partnerRes, requestRes] = await Promise.all([
        dbPartner.list(),
        dbPartner.received(),
      ])
      setPartners(partnerRes.data || [])
      setRequests(requestRes.data || [])
    } catch (err) {
      console.error("partner reload error:", err)
    }
  }

  const loadUsers = async () => {
    if (showUserList && allUsers.length > 0) {
      setShowUserList(false)
      return
    }
    setLoading(true)
    try {
      const res = await dbPartner.userList()
      const users = res.data || []
      setAllUsers(users)
      setShowUserList(true)
      if (users.length === 0) {
        setMessage("사주 프로필을 등록한 유저가 없어요. 먼저 커뮤니티 > 궁합매칭에서 프로필을 등록해주세요!")
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "유저 목록을 불러올 수 없습니다")
      setTimeout(() => setMessage(""), 3000)
    }
    setLoading(false)
  }

  const handleRequest = async (target: UserProfile) => {
    try {
      await dbPartner.request(target.userId, target.nickname)
      setMessage(target.nickname + "님에게 동반자 신청을 보냈습니다!")
      // 신청한 유저를 목록에서 제거
      setAllUsers((prev) => prev.filter((u) => u.userId !== target.userId))
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "신청 실패")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleAccept = async (requestId: string) => {
    try {
      await dbPartner.accept(requestId)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "수락 실패")
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await dbPartner.reject(requestId)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "거절 실패")
    }
  }

  const handleRemove = async (partnerId: string) => {
    if (!confirm("이 동반자와의 연결을 해제할까요?")) return
    try {
      await dbPartner.remove(partnerId)
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "해제 실패")
    }
  }

  if (status === "loading") return null

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="text-4xl ghost-float inline-block">👻💕👻</div>
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">영혼의동반자</h1>
        <p className="text-xs text-cemetery-ghost/40">서로의 묘비를 보고, 조언을 나눌 수 있는 영혼의 친구</p>
      </div>

      {/* 메시지 */}
      {message && (
        <div className="bg-cemetery-accent/10 border border-cemetery-accent/30 rounded-xl p-3 text-center text-sm text-cemetery-accent animate-fade-in">
          {message}
        </div>
      )}

      {/* 받은 신청 */}
      {requests.length > 0 && (
        <section className="bg-cemetery-card border border-yellow-500/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-yellow-400">📩 받은 신청 ({requests.length})</h2>
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-cemetery-surface rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👻</span>
                <span className="text-sm text-cemetery-heading">{r.fromNickname}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAccept(r.id)}
                  className="px-3 py-1.5 text-xs bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-lg transition-colors cute-press">
                  수락
                </button>
                <button onClick={() => handleReject(r.id)}
                  className="px-3 py-1.5 text-xs bg-cemetery-surface border border-cemetery-border hover:border-red-500/50 rounded-lg transition-colors">
                  거절
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 내 동반자 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-cemetery-heading">💀 나의 영혼의동반자</h2>
        {partners.length > 0 ? (
          <div className="grid gap-3">
            {partners.map((p) => (
              <div key={p.id} className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4 flex items-center justify-between tombstone-hover">
                <a href={"/partner/" + p.partnerId} className="flex items-center gap-3 flex-1">
                  <span className="text-2xl ghost-float">👻</span>
                  <div>
                    <p className="text-sm font-semibold text-cemetery-heading">{p.partnerNickname}</p>
                    <p className="text-[10px] text-cemetery-ghost/40">클릭하여 묘비 열람</p>
                  </div>
                </a>
                <button onClick={() => handleRemove(p.id)}
                  className="text-[10px] text-cemetery-ghost/20 hover:text-red-400 transition-colors">
                  연결 해제
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-cemetery-card border border-cemetery-border rounded-2xl">
            <span className="text-3xl opacity-30">👻</span>
            <p className="text-xs text-cemetery-ghost/30 mt-2">아직 영혼의동반자가 없어요</p>
          </div>
        )}
      </section>

      {/* 동반자 신청 - 유저 목록 */}
      <section className="space-y-3">
        <button
          onClick={loadUsers}
          disabled={loading}
          className="w-full py-3 bg-cemetery-card border border-dashed border-cemetery-border hover:border-cemetery-accent
            rounded-2xl transition-all text-sm text-cemetery-ghost hover:text-cemetery-heading cute-press disabled:opacity-50"
        >
          {loading ? "불러오는 중..." : showUserList ? "✕ 목록 닫기" : "🔍 동반자 찾기"}
        </button>

        {showUserList && (
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold text-cemetery-heading">
              동반자 신청 가능한 유저 ({allUsers.length}명)
            </h3>
            <p className="text-[10px] text-cemetery-ghost/40">사주 프로필을 등록한 유저만 표시됩니다</p>

            {allUsers.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-cemetery-surface rounded-xl p-3 hover:bg-cemetery-surface/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ELEMENT_EMOJI[user.dominantElement] || "🔮"}</span>
                      <div>
                        <p className="text-sm text-cemetery-heading">{user.nickname}</p>
                        <div className="flex gap-2">
                          {user.dominantElement && (
                            <span className="text-[10px] text-cemetery-ghost/40">{user.dominantElement}</span>
                          )}
                          {user.mbti && (
                            <span className="text-[10px] text-cemetery-accent/60">{user.mbti}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRequest(user)}
                      className="px-3 py-1.5 text-xs bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-lg transition-colors cute-press">
                      신청 💕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-cemetery-ghost/30">
                  신청 가능한 유저가 없어요
                </p>
                <p className="text-[10px] text-cemetery-ghost/20 mt-1">
                  사주 프로필을 등록한 유저만 표시됩니다
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
