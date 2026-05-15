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

/** 수사학(Rhetoric) 분석: 대화 데이터 교차 분석으로 깊은 인사이트 도출 */
function RhetoricAnalysis({ analysis }: { analysis: ChatAnalysis }) {
  const persons = Object.entries(analysis.messagesByPerson)
  if (persons.length < 2) return null

  const total = analysis.totalMessages
  const [personA, countA] = persons[0]
  const [personB, countB] = persons[1]
  const ratioA = Math.round((countA / total) * 100)
  const ratioB = Math.round((countB / total) * 100)
  const dominant = countA > countB ? personA : personB
  const passive = countA > countB ? personB : personA
  const gap = Math.abs(ratioA - ratioB)

  const sentiment = analysis.sentimentScore
  const loveTemp = analysis.loveTemperature
  const topicCount = analysis.topTopics?.length || 0
  const topics = analysis.topTopics || []
  const activeHour = analysis.mostActiveHour

  // 응답 시간 비대칭
  const responseTimes = Object.entries(analysis.avgResponseTime)
  const timeA = responseTimes.find(([n]) => n === personA)?.[1] || 0
  const timeB = responseTimes.find(([n]) => n === personB)?.[1] || 0
  const fasterPerson = timeA < timeB ? personA : personB
  const slowerPerson = timeA < timeB ? personB : personA
  const timeGap = Math.abs(timeA - timeB)
  const avgTime = (timeA + timeB) / 2

  // --- 에토스 (신뢰/권위) 점수 ---
  let ethosScore = 50
  if (avgTime < 5) ethosScore += 30
  else if (avgTime < 15) ethosScore += 20
  else if (avgTime < 30) ethosScore += 5
  else ethosScore -= 10
  if (timeGap < 5) ethosScore += 15 // 응답 시간 대칭 = 상호 신뢰
  else if (timeGap > 20) ethosScore -= 10
  if (gap < 10) ethosScore += 10 // 대화량 균형 = 동등한 관계
  ethosScore = Math.max(0, Math.min(100, ethosScore))

  // --- 파토스 (감정/공감) 점수 ---
  let pathosScore = 50
  if (sentiment > 70) pathosScore += 25
  else if (sentiment > 50) pathosScore += 10
  else if (sentiment < 30) pathosScore -= 15
  if (loveTemp > 70) pathosScore += 20
  else if (loveTemp > 50) pathosScore += 10
  else if (loveTemp < 30) pathosScore -= 10
  // 일상 주제가 많으면 파토스 낮음 (정서적 깊이 부족)
  const emotionTopics = topics.filter((t) => ["사랑표현", "감정", "걱정/위로", "그리움", "애교"].includes(t.topic))
  if (emotionTopics.length >= 2) pathosScore += 15
  pathosScore = Math.max(0, Math.min(100, pathosScore))

  // --- 로고스 (논리/내용) 점수 ---
  let logosScore = 50
  if (topicCount >= 8) logosScore += 25
  else if (topicCount >= 5) logosScore += 15
  else if (topicCount >= 3) logosScore += 5
  else logosScore -= 10
  if (total > 5000) logosScore += 15
  else if (total > 1000) logosScore += 5
  // 주제 편중도 (1위 주제 비율이 높으면 로고스 낮음)
  if (topics.length > 0 && topics[0].percentage > 40) logosScore -= 10
  logosScore = Math.max(0, Math.min(100, logosScore))

  // --- 종합 소통 유형 판정 ---
  const maxScore = Math.max(ethosScore, pathosScore, logosScore)
  const commType = maxScore === ethosScore ? "신뢰형" : maxScore === pathosScore ? "감정형" : "논리형"

  // --- 관계 역학 인사이트 ---
  const insights: string[] = []

  // 대화량 비대칭
  if (gap > 20) {
    insights.push(`${dominant}이 대화의 ${Math.max(ratioA, ratioB)}%를 차지합니다. ${passive}은 듣는 역할에 머물러 있어요. 수사학적으로 ${dominant}이 '화자(speaker)' 역할을 독점하면 ${passive}은 점점 대화에서 이탈할 수 있습니다.`)
  } else if (gap < 5) {
    insights.push(`두 사람의 대화량이 거의 동등합니다 (${ratioA}% vs ${ratioB}%). 서로의 발언권을 존중하는 이상적인 대화 구조예요.`)
  }

  // 응답 시간 비대칭
  if (timeGap > 15) {
    insights.push(`${fasterPerson}(평균 ${Math.round(timeA < timeB ? timeA : timeB)}분)이 ${slowerPerson}(평균 ${Math.round(timeA < timeB ? timeB : timeA)}분)보다 훨씬 빠르게 응답합니다. 관심도의 온도 차이가 느껴지는 구간이에요.`)
  } else if (timeGap < 3 && avgTime < 10) {
    insights.push(`두 사람 모두 빠르게 응답하고 있어요. 서로에 대한 관심과 대화 몰입도가 높은 상태입니다.`)
  }

  // 감정+연애온도 교차
  if (sentiment > 60 && loveTemp > 60) {
    insights.push(`감정 점수(${sentiment}%)와 연애 온도(${loveTemp}°)가 모두 높습니다. 감정적으로 깊이 연결된 대화를 나누고 있어요.`)
  } else if (sentiment > 60 && loveTemp < 40) {
    insights.push(`감정 표현은 활발하지만(${sentiment}%), 연애 온도는 낮은 편(${loveTemp}°)이에요. 감정은 있으나 연애 감정보다는 우정/편안함에 가까운 소통일 수 있습니다.`)
  } else if (sentiment < 40 && loveTemp > 60) {
    insights.push(`감정 표현은 절제되어 있지만(${sentiment}%), 연애 온도는 높습니다(${loveTemp}°). 말보다 행동으로 표현하는 타입이거나, 감정을 숨기고 있을 가능성이 있어요.`)
  } else if (sentiment < 35 && loveTemp < 35) {
    insights.push(`감정 점수(${sentiment}%)와 연애 온도(${loveTemp}°) 모두 낮습니다. 대화가 사무적이거나 이미 감정적 거리가 생긴 상태일 수 있어요.`)
  }

  // 대화 시간대
  if (activeHour >= 22 || activeHour <= 2) {
    insights.push(`가장 활발한 대화 시간이 ${activeHour}시입니다. 밤늦은 시간의 대화는 감정적 방어가 낮아져 더 솔직한 소통이 이뤄지지만, 감정적 과잉으로 번질 위험도 있어요.`)
  } else if (activeHour >= 7 && activeHour <= 9) {
    insights.push(`아침 시간대(${activeHour}시)에 가장 활발합니다. 하루의 시작을 함께 나누는 건 상대가 일상의 우선순위에 있다는 신호예요.`)
  }

  // 주제 편중
  if (topics.length > 0 && topics[0].percentage > 35) {
    insights.push(`'${topics[0].topic}' 주제가 전체의 ${topics[0].percentage}%를 차지합니다. 대화가 한 주제에 편중되면 관계의 다면성이 줄어들 수 있어요.`)
  }

  const SCORES = [
    { label: "에토스 (신뢰·권위)", score: ethosScore, color: "bg-blue-400",
      detail: ethosScore > 70 ? "상호 응답 속도와 대화량이 균형 잡혀 있어 동등하고 신뢰감 있는 관계입니다."
        : ethosScore > 40 ? "기본적인 관계 신뢰는 있으나, 응답 패턴에서 미세한 온도 차이가 감지됩니다."
        : "응답 비대칭이나 대화량 불균형이 관계의 신뢰 기반을 약화시킬 수 있어요." },
    { label: "파토스 (감정·공감)", score: pathosScore, color: "bg-red-400",
      detail: pathosScore > 70 ? "감정 교류가 활발하고 공감 수준이 높습니다. 서로의 감정에 적극 반응하는 패턴이에요."
        : pathosScore > 40 ? "감정 표현이 적절한 수준입니다. 더 솔직한 감정 교류가 관계를 깊게 할 수 있어요."
        : "감정 표현이 부족하거나 회피하는 패턴이 보입니다. 속마음을 나누는 연습이 필요해요." },
    { label: "로고스 (논리·내용)", score: logosScore, color: "bg-green-400",
      detail: logosScore > 70 ? "다양한 주제로 풍성한 대화를 나누고 있어요. 지적 교감이 활발한 관계입니다."
        : logosScore > 40 ? "대화 주제가 적절합니다. 새로운 관심사를 공유하면 관계가 더 풍요로워질 거예요."
        : "대화 주제가 제한적이에요. 서로의 관심사를 탐색하며 대화의 폭을 넓혀보세요." },
  ]

  return (
    <div className="space-y-4 border-t border-cemetery-border/30 pt-4">
      <div>
        <h4 className="text-sm text-cemetery-heading font-semibold">📜 수사학 분석</h4>
        <p className="text-xs text-cemetery-ghost/40 mt-0.5">
          아리스토텔레스의 설득 3요소 + 대화 데이터 교차 분석
        </p>
      </div>

      {/* 소통 유형 뱃지 */}
      <div className="bg-cemetery-surface rounded-xl p-4 text-center">
        <p className="text-xs text-cemetery-ghost/50 mb-1">소통 유형</p>
        <p className="text-xl font-bold text-cemetery-accent">{commType} 소통</p>
        <p className="text-xs text-cemetery-ghost/50 mt-1">
          {commType === "신뢰형" ? "안정적이고 균형 잡힌 대화를 선호하는 관계" :
           commType === "감정형" ? "감정 교류와 공감이 대화의 핵심인 관계" :
           "다양한 주제와 깊이 있는 내용으로 소통하는 관계"}
        </p>
      </div>

      {/* 3요소 점수 */}
      <div className="space-y-3">
        {SCORES.map((s) => (
          <div key={s.label} className="bg-cemetery-surface/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cemetery-text">{s.label}</span>
              <span className={`text-sm font-bold ${s.score > 70 ? "text-green-400" : s.score > 40 ? "text-yellow-400" : "text-red-400"}`}>
                {s.score}점
              </span>
            </div>
            <div className="h-2.5 bg-cemetery-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.color} transition-all`}
                style={{ width: `${s.score}%` }} />
            </div>
            <p className="text-xs text-cemetery-ghost/60 leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>

      {/* 관계 역학 인사이트 */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-cemetery-heading">💡 관계 역학 인사이트</h4>
          {insights.map((insight, i) => (
            <div key={i} className="bg-cemetery-surface/30 border border-cemetery-border/30 rounded-xl px-4 py-3">
              <p className="text-xs text-cemetery-text leading-relaxed">{insight}</p>
            </div>
          ))}
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
