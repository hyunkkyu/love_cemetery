"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

export default function MigratePage() {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [status, setStatus] = useState("")
  const [done, setDone] = useState(false)

  const migrate = async () => {
    if (!userId) {
      setStatus("로그인이 필요합니다.")
      return
    }

    setStatus("마이그레이션 시작...")
    const results: string[] = []

    try {
      // 1. 묘비 데이터 - 모든 가능한 키 시도
      const gravesKeys = [
        `love-cemetery-${userId}`,
        "love-cemetery-graves",
        // userId 없는 버전들도 시도
        ...Object.keys(localStorage).filter(k =>
          k.startsWith("love-cemetery") &&
          !k.includes("coins") &&
          !k.includes("items") &&
          !k.includes("crushes") &&
          !k.includes("analysis") &&
          !k.includes("chat") &&
          !k.includes("positions") &&
          !k.includes("intro")
        ),
      ]
      let gravesRaw: string | null = null
      let foundKey = ""
      for (const key of gravesKeys) {
        const val = localStorage.getItem(key)
        if (val && val.startsWith("[")) {
          gravesRaw = val
          foundKey = key
          break
        }
      }
      results.push(`검색한 키: ${gravesKeys.join(", ")}`)
      results.push(`발견된 키: ${foundKey || "없음"}`)
      if (gravesRaw) {
        const graves = JSON.parse(gravesRaw)
        for (const grave of graves) {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "graves.save", userId, grave }),
          })
        }
        results.push(`묘비 ${graves.length}개 이전 완료`)
      } else {
        results.push("묘비 데이터 없음")
      }
      setStatus(results.join("\n"))

      // 2. 코인
      const coinsKey = `love-cemetery-coins-${userId}`
      const coins = localStorage.getItem(coinsKey)
      if (coins) {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "user.update", userId, updates: { coins: parseInt(coins) } }),
        })
        results.push(`코인 ${coins} 이전 완료`)
      }
      setStatus(results.join("\n"))

      // 3. 아이템
      const itemsKey = `love-cemetery-items-${userId}`
      const itemsRaw = localStorage.getItem(itemsKey)
      if (itemsRaw) {
        const items = JSON.parse(itemsRaw)
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "user.update", userId, updates: { ownedItems: items } }),
        })
        results.push(`아이템 ${items.length}개 이전 완료`)
      }
      setStatus(results.join("\n"))

      // 4. 썸 데이터
      const crushKey = `love-cemetery-crushes-${userId}`
      const crushRaw = localStorage.getItem(crushKey)
      if (crushRaw) {
        const crushes = JSON.parse(crushRaw)
        for (const crush of crushes) {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "crushes.save", userId, crush }),
          })
        }
        results.push(`썸 ${crushes.length}명 이전 완료`)
      }
      setStatus(results.join("\n"))

      // 5. 분석 기록
      const analysisKey = `love-cemetery-analysis-${userId}`
      const analysisRaw = localStorage.getItem(analysisKey)
      if (analysisRaw) {
        const records = JSON.parse(analysisRaw)
        for (const record of records) {
          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "analysis.save", userId, record }),
          })
        }
        results.push(`분석 기록 ${records.length}건 이전 완료`)
      }
      setStatus(results.join("\n"))

      // 6. 채팅 기록
      let chatCount = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`love-cemetery-chat-${userId}-`)) {
          const graveId = key.replace(`love-cemetery-chat-${userId}-`, "")
          const messages = JSON.parse(localStorage.getItem(key) || "[]")
          if (messages.length > 0) {
            await fetch("/api/data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "chat.save", userId, graveId, messages }),
            })
            chatCount++
          }
        }
      }
      if (chatCount > 0) results.push(`채팅 기록 ${chatCount}개 이전 완료`)
      setStatus(results.join("\n"))

      results.push("\n✅ 마이그레이션 완료!")
      setStatus(results.join("\n"))
      setDone(true)

    } catch (err) {
      results.push(`\n❌ 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
      setStatus(results.join("\n"))
    }
  }

  // localStorage에 있는 키 미리보기
  const previewKeys = () => {
    const entries: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith("love-cemetery") || key.startsWith("chat-myname")) {
        const val = localStorage.getItem(key) || ""
        const preview = val.length > 60 ? val.substring(0, 60) + "..." : val
        entries.push(`${key} → ${preview}`)
      }
    }
    return entries
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-10">
      <h1 className="font-gothic text-2xl text-cemetery-heading text-center">
        🔄 데이터 마이그레이션
      </h1>
      <p className="text-cemetery-ghost text-sm text-center">
        브라우저에 저장된 기존 데이터를 서버 DB로 이전합니다.
      </p>

      {userId ? (
        <>
          <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-4">
            <p className="text-xs text-cemetery-ghost/50 mb-2">발견된 로컬 데이터:</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {previewKeys().length > 0 ? previewKeys().map((entry, i) => (
                <p key={i} className="text-[10px] text-cemetery-ghost/70 font-mono break-all">{entry}</p>
              )) : (
                <p className="text-xs text-cemetery-ghost/30">로컬 데이터가 없습니다</p>
              )}
            </div>
          </div>

          {!done ? (
            <button
              onClick={migrate}
              className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-xl font-semibold transition-colors"
            >
              🚀 마이그레이션 시작
            </button>
          ) : (
            <a
              href="/"
              className="block w-full py-3 bg-cemetery-accent text-center rounded-xl font-semibold"
            >
              홈으로 가기
            </a>
          )}

          {status && (
            <div className="bg-cemetery-surface rounded-xl p-4">
              <pre className="text-xs text-cemetery-ghost whitespace-pre-wrap">{status}</pre>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-red-400 text-sm">먼저 로그인해주세요</p>
      )}
    </div>
  )
}
