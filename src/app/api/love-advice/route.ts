import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { person, my, compatibility, pastGraves, selectedPast } = await request.json()

    const pastSummary = pastGraves?.length > 0
      ? pastGraves.map((g: { nickname: string; grade: string; causeOfDeath: string; graveReason?: string; compatibility?: { score: number }; chatAnalysis?: { loveTemperature: number; topTopics: unknown[] } }) =>
          `- ${g.nickname}: 궁합 ${g.compatibility?.score || "?"}점, 사인: ${g.causeOfDeath || "미상"}, 연애온도: ${g.chatAnalysis?.loveTemperature || "?"}°${g.graveReason ? `\n  사연: ${g.graveReason}` : ""}`
        ).join("\n")
      : "과거 연애 기록 없음"

    const prompt = `"명예의전당" 앱의 "살랑살랑" 코너에서 현재 썸/연애 상대 분석을 요청했습니다.

[현재 상대: ${person.nickname}]
사주: ${person.manseryeok?.summary || "정보 없음"}
오행: ${JSON.stringify(person.manseryeok?.elementBalance || {})}
성격/MBTI: ${person.persona || "미입력"}
카톡 스타일: ${person.chatStyle || "미입력"}

[나의 사주]
${my.manseryeok?.summary || "정보 없음"}
오행: ${JSON.stringify(my.manseryeok?.elementBalance || {})}

[궁합 분석 결과]
점수: ${compatibility.score}점
강점: ${compatibility.strengths?.join(" / ") || "없음"}
약점: ${compatibility.weaknesses?.join(" / ") || "없음"}

[과거 연애 히스토리 (명예의전당에 묻힌 연애들)]
${pastSummary}

${selectedPast ? `[특별 비교 대상: ${selectedPast.nickname}]
궁합: ${selectedPast.compatibility?.score || "?"}점
사주: ${selectedPast.manseryeok?.summary || "정보 없음"}
사인: ${selectedPast.causeOfDeath || "미상"}
${selectedPast.graveReason ? `묻힌 사연: ${selectedPast.graveReason}` : ""}` : ""}

위 정보를 바탕으로 다음을 분석해주세요:

1. **💘 이 사람과의 케미 분석**: 사주 궁합의 핵심 포인트를 비유와 함께 설명. "이런 조합은 ~와 같아요" 식으로 일상적 비유를 꼭 사용
2. **🔮 연애 전망**: 이 관계가 발전할 가능성, 주의할 점, 시너지 포인트
3. ${selectedPast ? `**⚰️ ${selectedPast.nickname} vs ${person.nickname} 비교**: 과거 연애 사연을 참고하여 구체적으로 뭐가 다른지, 같은 실수를 반복할 가능성은 없는지, 과거의 아픔이 이번 관계에 어떤 영향을 줄 수 있는지` : `**⚰️ 과거 패턴 분석**: 과거 연애들의 사연과 비교했을 때 이번엔 뭐가 다른지, 반복되는 패턴이 있는지`}
4. **💌 실전 조언**: 이 사람과 잘 되려면 구체적으로 어떻게 해야 하는지 (대화법, 데이트 장소, 주의사항 등)
5. **🎨 개운 포인트**: 이 커플에게 좋은 색상, 방향, 데이트 장소

따뜻하고 설레는 톤으로, 하지만 뼈때리는 현실 조언도 섞어서 작성해주세요. "~거든요", "~이에요" 같은 다정한 구어체로 써주세요.`

    const advice = await callLLM(prompt, "medium")
    return NextResponse.json({ advice })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "분석 중 오류"
    return NextResponse.json({ advice: `⚠️ ${msg}` }, { status: 500 })
  }
}
