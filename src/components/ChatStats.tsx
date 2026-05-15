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
      {/* 수사학 분석 */}
      <RhetoricAnalysis analysis={analysis} />
    </div>
  )
}

/** 수사학(Rhetoric) 분석: 대화 데이터에서 에토스/파토스/로고스 패턴 도출 */
function RhetoricAnalysis({ analysis }: { analysis: ChatAnalysis }) {
  const persons = Object.entries(analysis.messagesByPerson)
  if (persons.length < 2) return null

  const total = analysis.totalMessages
  const [personA, countA] = persons[0]
  const [personB, countB] = persons[1]

  // 대화 비율로 주도권 분석
  const ratioA = countA / total
  const ratioB = countB / total
  const dominant = ratioA > ratioB ? personA : personB
  const dominantRatio = Math.round(Math.max(ratioA, ratioB) * 100)

  // 감정 점수 → 파토스(감정 호소) 지표
  const sentiment = analysis.sentimentScore
  const pathosLevel = sentiment > 70 ? "높음" : sentiment > 40 ? "보통" : "낮음"
  const pathosDesc = sentiment > 70
    ? "감정 표현이 풍부한 대화입니다. 파토스(감정 호소) 중심의 소통 패턴이에요."
    : sentiment > 40
      ? "감정과 논리가 균형 잡힌 대화입니다."
      : "감정 표현이 절제된 대화입니다. 로고스(논리) 중심이거나 감정을 잘 드러내지 않는 패턴이에요."

  // 응답 시간 → 에토스(신뢰/관계) 지표
  const avgTimes = Object.values(analysis.avgResponseTime)
  const avgTime = avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0
  const ethosLevel = avgTime < 10 ? "높음" : avgTime < 30 ? "보통" : "낮음"
  const ethosDesc = avgTime < 10
    ? "빠른 응답은 상대에 대한 높은 관심과 신뢰(에토스)를 보여줍니다."
    : avgTime < 30
      ? "적절한 응답 속도로 안정적인 관계 신뢰도를 보여줍니다."
      : "느린 응답은 관계의 우선순위가 낮거나, 신중한 소통 스타일일 수 있습니다."

  // 주제 다양성 → 로고스(논리/내용) 지표
  const topicCount = analysis.topTopics?.length || 0
  const logosLevel = topicCount >= 6 ? "높음" : topicCount >= 3 ? "보통" : "낮음"
  const logosDesc = topicCount >= 6
    ? "다양한 주제를 다루며 깊이 있는 대화(로고스)가 이뤄졌습니다."
    : topicCount >= 3
      ? "적절한 주제 범위로 소통하고 있습니다."
      : "대화 주제가 제한적입니다. 더 다양한 이야기를 나눠보세요."

  const BARS = [
    { label: "에토스 (신뢰)", level: ethosLevel, desc: ethosDesc, color: "bg-blue-400" },
    { label: "파토스 (감정)", level: pathosLevel, desc: pathosDesc, color: "bg-red-400" },
    { label: "로고스 (논리)", level: logosLevel, desc: logosDesc, color: "bg-green-400" },
  ]
  const LEVEL_WIDTH = { "높음": "100%", "보통": "60%", "낮음": "25%" }
  const LEVEL_COLOR = { "높음": "text-green-400", "보통": "text-yellow-400", "낮음": "text-red-400" }

  return (
    <div className="space-y-3 border-t border-cemetery-border/30 pt-4">
      <h4 className="text-sm text-cemetery-heading font-semibold">📜 수사학 분석 (Rhetoric)</h4>
      <p className="text-xs text-cemetery-ghost/50">
        아리스토텔레스의 설득의 3요소로 대화 패턴을 분석합니다.
      </p>

      {/* 3요소 바 차트 */}
      <div className="space-y-2.5">
        {BARS.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-cemetery-text">{bar.label}</span>
              <span className={"text-xs font-bold " + LEVEL_COLOR[bar.level as keyof typeof LEVEL_COLOR]}>{bar.level}</span>
            </div>
            <div className="h-2 bg-cemetery-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${bar.color} transition-all`}
                style={{ width: LEVEL_WIDTH[bar.level as keyof typeof LEVEL_WIDTH] }} />
            </div>
            <p className="text-[10px] text-cemetery-ghost/40 mt-0.5">{bar.desc}</p>
          </div>
        ))}
      </div>

      {/* 대화 주도권 */}
      <div className="bg-cemetery-surface rounded-xl p-3">
        <p className="text-xs text-cemetery-ghost/50 mb-1">대화 주도권</p>
        <p className="text-sm text-cemetery-text">
          <strong className="text-cemetery-accent">{dominant}</strong>이 전체 대화의 {dominantRatio}%를 차지하며 소통을 주도합니다.
          {dominantRatio > 65
            ? " 한쪽이 과도하게 주도하면 상대가 소통에서 소외감을 느낄 수 있어요."
            : " 비교적 균형 잡힌 대화 비율입니다."}
        </p>
      </div>
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
