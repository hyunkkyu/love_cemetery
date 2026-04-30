"use client"

import type { ChatAnalysis } from "@/types"

export function ChatStats({ analysis }: { analysis: ChatAnalysis }) {
  const persons = Object.entries(analysis.messagesByPerson)
  const maxMessages = Math.max(...persons.map(([, v]) => v))

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 메시지" value={analysis.totalMessages.toLocaleString()} />
        <StatCard
          label="연애 온도"
          value={`${analysis.loveTemperature}°`}
          color={analysis.loveTemperature > 70 ? "text-red-400" : analysis.loveTemperature > 40 ? "text-yellow-400" : "text-blue-400"}
        />
        <StatCard label="감정 점수" value={`${analysis.sentimentScore}%`} />
        <StatCard label="최다 활동 시간" value={`${analysis.mostActiveHour}시`} />
      </div>

      {/* 인원별 메시지 수 */}
      <div className="space-y-2">
        <h4 className="text-sm text-cemetery-ghost">대화 비율</h4>
        {persons.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-sm text-cemetery-text w-24 truncate">{name}</span>
            <div className="flex-1 h-6 bg-cemetery-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-cemetery-accent/40 rounded-full flex items-center px-2"
                style={{ width: `${(count / maxMessages) * 100}%` }}
              >
                <span className="text-xs text-cemetery-text">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 평균 응답 시간 */}
      {Object.keys(analysis.avgResponseTime).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm text-cemetery-ghost">평균 응답 시간</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(analysis.avgResponseTime).map(([name, mins]) => (
              <div key={name} className="bg-cemetery-surface rounded-lg p-3 text-center">
                <p className="text-xs text-cemetery-ghost/60">{name}</p>
                <p className="text-lg font-bold text-cemetery-heading">
                  {mins < 60 ? `${mins}분` : `${Math.floor(mins / 60)}시간 ${mins % 60}분`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자주 나눈 대화 주제 */}
      {analysis.topTopics?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm text-cemetery-ghost">자주 나눈 대화 주제</h4>
          <div className="space-y-2">
            {analysis.topTopics.map(({ topic, emoji, count, percentage }) => (
              <div key={topic} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center">{emoji}</span>
                <span className="text-sm text-cemetery-text w-24 truncate">{topic}</span>
                <div className="flex-1 h-5 bg-cemetery-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cemetery-accent/30 rounded-full flex items-center px-2"
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  >
                    <span className="text-[10px] text-cemetery-text whitespace-nowrap">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-cemetery-ghost/50 w-12 text-right">
                  {count}회
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color = "text-cemetery-heading",
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-cemetery-surface rounded-lg p-3 text-center">
      <p className="text-xs text-cemetery-ghost/60">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
