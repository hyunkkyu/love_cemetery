"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { dbStats } from "@/lib/stats-client"

type Tab = "ranking" | "mbti" | "ilju" | "insight"

const ELEMENT_EMOJI: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" }
const ELEMENT_COLOR: Record<string, string> = { 목: "text-green-400", 화: "text-red-400", 토: "text-yellow-400", 금: "text-gray-300", 수: "text-blue-400" }

export default function StatsPage() {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [tab, setTab] = useState<Tab>("ranking")
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null)
  const [ranking, setRanking] = useState<Array<Record<string, unknown>>>([])
  const [myPos, setMyPos] = useState<{ rank: number; graveCount: number } | null>(null)
  const [mbtiData, setMbtiData] = useState<Array<Record<string, unknown>>>([])
  const [iljuData, setIljuData] = useState<Array<Record<string, unknown>>>([])
  const [myGroup, setMyGroup] = useState<Record<string, unknown> | null>(null)
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null)

  useEffect(() => {
    dbStats.overview().then(setOverview).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === "ranking") {
      dbStats.ranking().then(setRanking).catch(() => {})
      if (userId) dbStats.myPosition().then(setMyPos).catch(() => {})
    }
    if (tab === "mbti") dbStats.mbtiStats().then(setMbtiData).catch(() => {})
    if (tab === "ilju") dbStats.iljuStats().then(setIljuData).catch(() => {})
    if (tab === "insight" && userId) dbStats.myGroup().then(setMyGroup).catch(() => {})
  }, [tab, userId])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">📊 명예의전당 통계</h1>
        <p className="text-xs text-cemetery-ghost/40">유령들의 연애 데이터로 보는 인사이트</p>
      </div>

      {/* 전체 요약 */}
      {overview && (
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="총 유저" value={String(overview.totalUsers || 0)} />
          <StatBox label="총 묘비" value={String(overview.totalGraves || 0)} />
          <StatBox label="사주 등록" value={String(overview.totalProfiles || 0)} />
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 justify-center">
        {([["ranking", "🏆 랭킹"], ["mbti", "🧠 MBTI"], ["ilju", "🔮 일주"], ["insight", "💡 내 인사이트"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-xs transition-all ${tab === key
              ? "bg-cemetery-accent text-white" : "bg-cemetery-card border border-cemetery-border text-cemetery-ghost"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 랭킹 탭 */}
      {tab === "ranking" && (
        <div className="space-y-4">
          {myPos && (
            <div className="bg-cemetery-accent/10 border border-cemetery-accent/30 rounded-2xl p-4 text-center">
              <p className="text-xs text-cemetery-ghost/50">나의 순위</p>
              <p className="text-2xl font-bold text-cemetery-accent">{myPos.rank}등</p>
              <p className="text-xs text-cemetery-ghost/40">묘비 {myPos.graveCount}개</p>
            </div>
          )}
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
            {ranking.length > 0 ? ranking.map((r) => (
              <div key={r.userId as string}
                className={`flex items-center gap-3 px-4 py-3 border-b border-cemetery-border/30 last:border-0
                  ${r.userId === userId ? "bg-cemetery-accent/5" : ""}`}>
                <span className={`w-8 text-center font-bold ${
                  r.rank === 1 ? "text-yellow-400 text-lg" : r.rank === 2 ? "text-gray-300" : r.rank === 3 ? "text-orange-400" : "text-cemetery-ghost/40"
                }`}>
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `${r.rank}`}
                </span>
                <span className="flex-1 text-sm text-cemetery-text">{r.nickname as string}</span>
                <span className="text-sm text-cemetery-accent font-semibold">🪦 {r.graveCount as number}</span>
              </div>
            )) : (
              <p className="text-center py-8 text-cemetery-ghost/30 text-sm">아직 묘비 데이터가 없어요</p>
            )}
          </div>
        </div>
      )}

      {/* MBTI 탭 */}
      {tab === "mbti" && (
        <div className="space-y-4">
          {mbtiData.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {mbtiData.map((m) => (
                  <button key={m.mbti as string} onClick={() => setSelectedMbti(selectedMbti === m.mbti ? null : m.mbti as string)}
                    className={`p-3 rounded-xl border text-center transition-all ${selectedMbti === m.mbti
                      ? "border-cemetery-accent bg-cemetery-accent/10" : "border-cemetery-border bg-cemetery-card tombstone-hover"}`}>
                    <p className="text-sm font-bold text-cemetery-heading">{m.mbti as string}</p>
                    <p className="text-xs text-cemetery-ghost/50">{m.userCount as number}명</p>
                  </button>
                ))}
              </div>
              {selectedMbti && (() => {
                const m = mbtiData.find((d) => d.mbti === selectedMbti)
                if (!m) return null
                return (
                  <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3 animate-fade-in">
                    <h3 className="font-semibold text-cemetery-heading">{selectedMbti} 유형의 연애 패턴</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <StatBox label="총 묘비" value={`${m.graveCount}`} />
                      <StatBox label="평균 교제" value={m.avgDuration ? `${m.avgDuration}개월` : "-"} />
                      <StatBox label="주요 사인" value={(m.topCause as string) || "-"} />
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <p className="text-center py-12 text-cemetery-ghost/30 text-sm">
              MBTI 데이터가 부족해요. <a href="/community/match" className="text-cemetery-accent">사주 프로필</a>에서 MBTI를 등록해주세요!
            </p>
          )}
        </div>
      )}

      {/* 일주 탭 */}
      {tab === "ilju" && (
        <div className="space-y-3">
          {iljuData.length > 0 ? iljuData.map((d) => (
            <div key={d.ilju as string} className="flex items-center gap-3 bg-cemetery-card border border-cemetery-border rounded-xl p-3">
              <span className="text-xl">{ELEMENT_EMOJI[d.element as string] || "🔮"}</span>
              <span className={`text-sm font-semibold w-12 ${ELEMENT_COLOR[d.element as string] || ""}`}>{d.ilju as string}</span>
              <div className="flex-1 h-4 bg-cemetery-surface rounded-full overflow-hidden">
                <div className="h-full bg-cemetery-accent/40 rounded-full"
                  style={{ width: `${Math.max(10, ((d.userCount as number) / Math.max(1, (iljuData[0]?.userCount as number))) * 100)}%` }} />
              </div>
              <span className="text-xs text-cemetery-ghost/50">{d.userCount as number}명</span>
              <span className="text-xs text-cemetery-ghost/30">🪦{d.graveCount as number}</span>
            </div>
          )) : (
            <p className="text-center py-12 text-cemetery-ghost/30 text-sm">
              일주 데이터가 부족해요. <a href="/community/match" className="text-cemetery-accent">사주 프로필</a>을 등록해주세요!
            </p>
          )}
        </div>
      )}

      {/* 내 인사이트 탭 */}
      {tab === "insight" && (
        <div className="space-y-4">
          {!userId ? (
            <p className="text-center py-12 text-cemetery-ghost/30 text-sm">
              <a href="/login" className="text-cemetery-accent">로그인</a>하면 맞춤 인사이트를 볼 수 있어요
            </p>
          ) : myGroup?.needsProfile ? (
            <div className="text-center py-12 space-y-3">
              <span className="text-4xl ghost-float inline-block">🔮</span>
              <p className="text-cemetery-ghost/50 text-sm">사주 프로필에 MBTI와 생년월일을 등록하면<br/>나와 비슷한 사람들의 패턴을 볼 수 있어요</p>
              <a href="/community/match" className="inline-block px-4 py-2 bg-cemetery-accent rounded-xl text-sm">프로필 등록하기</a>
            </div>
          ) : myGroup ? (
            <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
              <h3 className="font-gothic text-lg text-cemetery-heading">
                {myGroup.mbti ? <span className="text-cemetery-accent">{String(myGroup.mbti)}</span> : null}
                {myGroup.mbti && myGroup.ilju ? " · " : null}
                {myGroup.ilju ? <span className={ELEMENT_COLOR[String(myGroup.element)] || ""}>{String(myGroup.ilju)}</span> : null}
                {" "}그룹
              </h3>
              <p className="text-xs text-cemetery-ghost/50">나와 같은 유형 {myGroup.groupSize as number}명의 데이터</p>

              <div className="grid grid-cols-3 gap-3">
                <StatBox label="평균 묘비 수" value={`${myGroup.avgGraveCount}`} />
                <StatBox label="평균 교제기간" value={myGroup.avgDuration ? `${myGroup.avgDuration}개월` : "-"} />
                <StatBox label="총 묘비" value={`${myGroup.totalGraves}`} />
              </div>

              {(myGroup.topCauses as [string, number][])?.length > 0 && (
                <div>
                  <p className="text-xs text-cemetery-ghost/50 mb-2">이 그룹의 주요 이별 사유</p>
                  {(myGroup.topCauses as [string, number][]).map(([cause, count], i) => (
                    <div key={cause} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-cemetery-accent">{i + 1}.</span>
                      <span className="text-sm text-cemetery-text flex-1">{cause}</span>
                      <span className="text-xs text-cemetery-ghost/30">{count}건</span>
                    </div>
                  ))}
                </div>
              )}

              {(myGroup.groupSize as number) === 0 && (
                <p className="text-center text-cemetery-ghost/30 text-xs py-4">
                  아직 같은 유형의 유저가 부족해요. 더 많은 유저가 모이면 인사이트가 풍부해져요!
                </p>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-cemetery-ghost/40 text-sm">로딩 중...</p>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cemetery-surface rounded-xl p-3 text-center">
      <p className="text-[10px] text-cemetery-ghost/40">{label}</p>
      <p className="text-lg font-bold text-cemetery-heading">{value}</p>
    </div>
  )
}
