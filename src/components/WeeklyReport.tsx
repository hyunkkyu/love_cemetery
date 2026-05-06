"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface ReportData {
  totalUsers: number
  totalGraves: number
  newUsersThisWeek: number
  newGravesThisWeek: number
  topCause: string
  popularFeature: string
}

export function WeeklyReport() {
  const { data: session } = useSession()
  const [report, setReport] = useState<ReportData | null>(null)

  useEffect(() => {
    if (!session) return
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "overview" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setReport({
            totalUsers: d.data.totalUsers || 0,
            totalGraves: d.data.totalGraves || 0,
            newUsersThisWeek: d.data.totalUsers || 0, // 간략화
            newGravesThisWeek: d.data.totalGraves || 0,
            topCause: d.data.topCauses?.[0]?._id || "미상",
            popularFeature: "살랑살랑",
          })
        }
      })
      .catch(() => {})
  }, [session])

  if (!report) return null

  return (
    <section className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cemetery-heading">📊 이번 주 명예의전당</h2>
        <a href="/stats" className="text-[10px] text-cemetery-accent hover:underline">더보기 →</a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-cemetery-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-cemetery-ghost/40">총 유령</p>
          <p className="text-lg font-bold text-cemetery-heading">{report.totalUsers}명</p>
        </div>
        <div className="bg-cemetery-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-cemetery-ghost/40">총 묘비</p>
          <p className="text-lg font-bold text-cemetery-heading">{report.totalGraves}기</p>
        </div>
        <div className="bg-cemetery-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-cemetery-ghost/40">인기 사인</p>
          <p className="text-sm font-bold text-red-400 truncate">{report.topCause}</p>
        </div>
        <div className="bg-cemetery-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-cemetery-ghost/40">인기 코너</p>
          <p className="text-sm font-bold text-pink-400">{report.popularFeature}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href="/invite" className="flex-1 py-2 bg-cemetery-accent/10 border border-cemetery-accent/20 text-cemetery-accent rounded-xl text-xs text-center transition-colors hover:bg-cemetery-accent/20">
          🎁 친구 초대하고 200코인
        </a>
        <a href="/grave" className="flex-1 py-2 bg-cemetery-surface border border-cemetery-border text-cemetery-ghost rounded-xl text-xs text-center transition-colors hover:border-cemetery-accent">
          🪦 묘비 세우기
        </a>
      </div>
    </section>
  )
}
