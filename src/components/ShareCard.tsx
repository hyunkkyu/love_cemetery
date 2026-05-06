"use client"

import { useRef, useState } from "react"

interface ShareCardProps {
  score: number
  personA: string
  personB: string
  elementHarmony: string
  strengths: string[]
  type?: "grave" | "love" | "ssum"
}

export function ShareCard({ score, personA, personB, elementHarmony, strengths, type = "grave" }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)

  const themeColors: Record<string, { bg1: string; bg2: string; accent: string; label: string }> = {
    grave: { bg1: "#0c0c14", bg2: "#1c1c30", accent: "#8b7bf7", label: "명예의전당" },
    love: { bg1: "#1f1428", bg2: "#2a1530", accent: "#ff8ec4", label: "살랑살랑" },
    ssum: { bg1: "#140c0c", bg2: "#301c1c", accent: "#ff6666", label: "썸붕분석" },
  }

  const generateImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setGenerating(true)

    const ctx = canvas.getContext("2d")!
    const w = 600
    const h = 400
    canvas.width = w
    canvas.height = h

    const theme = themeColors[type]

    // 배경 그라데이션
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, theme.bg1)
    grad.addColorStop(1, theme.bg2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 테두리
    ctx.strokeStyle = theme.accent + "40"
    ctx.lineWidth = 2
    ctx.roundRect(10, 10, w - 20, h - 20, 16)
    ctx.stroke()

    // 상단 라벨
    ctx.fillStyle = theme.accent + "80"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(theme.label, w / 2, 40)

    // 이름
    ctx.fillStyle = "#f0f0f8"
    ctx.font = "bold 24px sans-serif"
    ctx.fillText(personA + "  ♥  " + personB, w / 2, 85)

    // 궁합 점수 원형
    const cx = w / 2
    const cy = 170
    const radius = 55

    // 배경 원
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = theme.accent + "15"
    ctx.fill()

    // 진행 원호
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score / 100))
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 6
    ctx.lineCap = "round"
    ctx.stroke()

    // 점수
    ctx.fillStyle = theme.accent
    ctx.font = "bold 36px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(score + "%", cx, cy + 12)

    // 오행 조화
    ctx.fillStyle = "#b0b0cc"
    ctx.font = "13px sans-serif"
    ctx.fillText(elementHarmony, cx, cy + radius + 25)

    // 강점 (최대 3개)
    ctx.fillStyle = "#9999bb"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    const topStrengths = strengths.slice(0, 3)
    topStrengths.forEach((s, i) => {
      const text = s.length > 35 ? s.slice(0, 35) + "..." : s
      ctx.fillText("✦ " + text, cx, 280 + i * 22)
    })

    // 하단 워터마크
    ctx.fillStyle = "#666680"
    ctx.font = "11px sans-serif"
    ctx.fillText("love-cemetery.vercel.app", cx, h - 25)

    setGenerating(false)
  }

  const handleShare = async () => {
    generateImage()
    // 약간의 딜레이 후 다운로드
    setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const link = document.createElement("a")
      link.download = "compatibility-" + personA + "-" + personB + ".png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    }, 100)
  }

  const handleCopyLink = () => {
    const text = personA + " ♥ " + personB + " 궁합 " + score + "% - 명예의전당에서 확인! love-cemetery.vercel.app"
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    } else {
      // 폴백: 텍스트 선택 복사
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    alert("클립보드에 복사되었어요!")
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={handleShare}
          className="flex-1 py-2.5 bg-cemetery-accent/20 border border-cemetery-accent/30 text-cemetery-accent
            rounded-xl text-xs transition-colors hover:bg-cemetery-accent/30 cute-press">
          📸 이미지 저장
        </button>
        <button onClick={handleCopyLink}
          className="flex-1 py-2.5 bg-cemetery-surface border border-cemetery-border text-cemetery-ghost
            rounded-xl text-xs transition-colors hover:border-cemetery-accent cute-press">
          🔗 링크 복사
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
