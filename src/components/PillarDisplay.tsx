"use client"

import type { ManseryeokResult, FiveElement } from "@/types"

const ELEMENT_COLORS: Record<FiveElement, string> = {
  목: "text-green-400",
  화: "text-red-400",
  토: "text-yellow-400",
  금: "text-gray-300",
  수: "text-blue-400",
}

const ELEMENT_BG: Record<FiveElement, string> = {
  목: "bg-green-900/30",
  화: "bg-red-900/30",
  토: "bg-yellow-900/30",
  금: "bg-gray-700/30",
  수: "bg-blue-900/30",
}

export function PillarDisplay({ result }: { result: ManseryeokResult }) {
  const pillars = [
    { label: "시주", pillar: result.fourPillars.hour },
    { label: "일주", pillar: result.fourPillars.day },
    { label: "월주", pillar: result.fourPillars.month },
    { label: "연주", pillar: result.fourPillars.year },
  ]

  return (
    <div className="space-y-6">
      {/* 사주 기둥 */}
      <div className="flex justify-center gap-4">
        {pillars.map(({ label, pillar }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-cemetery-ghost/60 mb-2">{label}</p>
            <div className={`${ELEMENT_BG[pillar.element]} border border-cemetery-border rounded-lg p-3 w-16`}>
              <p className={`text-xl font-gothic font-bold ${ELEMENT_COLORS[pillar.element]}`}>
                {pillar.stem}
              </p>
              <div className="w-full border-t border-cemetery-border/50 my-1" />
              <p className={`text-xl font-gothic font-bold ${ELEMENT_COLORS[pillar.element]}`}>
                {pillar.branch}
              </p>
            </div>
            <p className="text-xs text-cemetery-ghost/40 mt-1">{pillar.yinYang}</p>
          </div>
        ))}
      </div>

      {/* 오행 분포 바 */}
      <div className="space-y-2">
        <h4 className="text-sm text-cemetery-ghost">오행 분포</h4>
        {(Object.entries(result.elementBalance) as [FiveElement, number][]).map(
          ([element, count]) => (
            <div key={element} className="flex items-center gap-2">
              <span className={`w-8 text-sm ${ELEMENT_COLORS[element]}`}>
                {element}
              </span>
              <div className="flex-1 h-4 bg-cemetery-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ELEMENT_BG[element]} ${ELEMENT_COLORS[element]}`}
                  style={{
                    width: `${(count / 8) * 100}%`,
                    backgroundColor: `currentColor`,
                    opacity: 0.4,
                  }}
                />
              </div>
              <span className="text-xs text-cemetery-ghost/60 w-4">{count}</span>
            </div>
          )
        )}
      </div>

      {/* 주요 특성 */}
      <div className="bg-cemetery-surface rounded-lg p-4">
        <p className="text-sm text-cemetery-ghost whitespace-pre-wrap">
          {result.summary}
        </p>
      </div>
    </div>
  )
}
