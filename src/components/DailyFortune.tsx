"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { dbStats } from "@/lib/stats-client"

const ELEMENT_EMOJI: Record<string, string> = { 목: "🌳", 화: "🔥", 토: "⛰️", 금: "⚔️", 수: "💧" }

interface DailyData {
  date: string
  dayElement: string
  luckScore: number
  todayAdvice: string
  encouragement: string
  graveCount: number
  dominantElement: string
}

export function DailyFortune() {
  const { data: session } = useSession()
  const [data, setData] = useState<DailyData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    // 오늘 이미 봤는지 확인
    const today = new Date().toISOString().split("T")[0]
    const seen = sessionStorage.getItem("daily-seen")
    if (seen === today) return

    dbStats.daily().then((d) => {
      if (d) {
        setData(d)
        setVisible(true)
      }
    }).catch(() => {})
  }, [session])

  const handleClose = () => {
    setVisible(false)
    sessionStorage.setItem("daily-seen", new Date().toISOString().split("T")[0])
  }

  if (!visible || !data) return null

  const emoji = ELEMENT_EMOJI[data.dayElement] || "🔮"
  const luckStars = "★".repeat(Math.round(data.luckScore / 20)) + "☆".repeat(5 - Math.round(data.luckScore / 20))

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 max-w-sm w-full space-y-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <p className="text-[10px] text-cemetery-ghost/40">{data.date}</p>
          <div className="text-4xl ghost-float inline-block">{emoji}</div>
          <h2 className="font-gothic text-xl text-cemetery-heading">오늘의 연애 사주</h2>
        </div>

        {/* 운세 점수 */}
        <div className="text-center space-y-1">
          <p className="text-yellow-400 tracking-widest">{luckStars}</p>
          <p className="text-2xl font-bold text-cemetery-accent">{data.luckScore}점</p>
          <p className="text-[10px] text-cemetery-ghost/40">
            오늘의 기운: <span className={data.dayElement === "목" ? "text-green-400" : data.dayElement === "화" ? "text-red-400" : data.dayElement === "토" ? "text-yellow-400" : data.dayElement === "금" ? "text-gray-300" : "text-blue-400"}>
              {data.dayElement}({emoji})
            </span>
          </p>
        </div>

        {/* 오늘의 조언 */}
        <div className="bg-cemetery-surface rounded-xl p-4">
          <p className="text-sm text-cemetery-text leading-relaxed italic">
            &ldquo;{data.todayAdvice}&rdquo;
          </p>
        </div>

        {/* 힘이 되는 한마디 */}
        <div className="bg-cemetery-accent/10 border border-cemetery-accent/20 rounded-xl p-4">
          <p className="text-[10px] text-cemetery-accent mb-1">💪 힘이 되는 한마디</p>
          <p className="text-sm text-cemetery-heading leading-relaxed">
            {data.encouragement}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl text-sm font-semibold transition-colors cute-press"
        >
          오늘도 파이팅 👻
        </button>
      </div>
    </div>
  )
}
