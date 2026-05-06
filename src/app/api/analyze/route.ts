import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"
import { connectDB } from "@/lib/db/mongoose"
import { AiLog } from "@/lib/db/models"
import { auth } from "@/lib/auth"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let prompt: string

    if (body.mode === "compare") {
      prompt = buildComparisonPrompt(body.graveA, body.graveB)
    } else {
      prompt = buildAnalysisPrompt(body)
    }

    const analysis = await callLLM(prompt)

    // 자동 저장
    try {
      await connectDB()
      const session = await auth()
      const userId = (session?.user as { id?: string })?.id
      await AiLog.create({ userId, type: body.mode === "compare" ? "compare" : "analyze", input: { nickname: body.nickname }, output: analysis, model: "gpt-4.1-mini" })
    } catch { /* 저장 실패해도 결과는 반환 */ }

    return NextResponse.json({ analysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다."
    return NextResponse.json({ analysis: `⚠️ ${message}` }, { status: 500 })
  }
}

function buildAnalysisPrompt(data: {
  nickname: string
  graveReason?: string
  manseryeok?: { fourPillars: unknown; dominantElement: string; elementBalance: unknown; summary: string }
  myManseryeok?: { fourPillars: unknown; dominantElement: string; elementBalance: unknown; summary: string }
  compatibility?: { score: number; elementHarmony: string; strengths: string[]; weaknesses: string[] }
  chatAnalysis?: { totalMessages: number; messagesByPerson: unknown; avgResponseTime: unknown; sentimentScore: number; loveTemperature: number; topTopics: unknown }
}): string {
  return `아래는 "${data.nickname}"와(과)의 연애를 "명예의전당"에 묻으면서 분석을 요청한 내용입니다.

${data.graveReason ? `[이 묘지에 묻힌 사연]\n${data.graveReason}\n` : ""}

${data.myManseryeok ? `[본인 사주]
${data.myManseryeok.summary}
오행 분포: ${JSON.stringify(data.myManseryeok.elementBalance)}
` : ""}

${data.manseryeok ? `[${data.nickname} 사주]
${data.manseryeok.summary}
오행 분포: ${JSON.stringify(data.manseryeok.elementBalance)}
` : ""}

${data.compatibility ? `[궁합 기본 데이터]
점수: ${data.compatibility.score}점
오행 조합: ${data.compatibility.elementHarmony}
강점: ${data.compatibility.strengths.join(", ")}
약점: ${data.compatibility.weaknesses.join(", ")}
` : ""}

${data.chatAnalysis ? `[카카오톡 대화 분석]
총 메시지: ${data.chatAnalysis.totalMessages}개
인원별 메시지: ${JSON.stringify(data.chatAnalysis.messagesByPerson)}
평균 응답시간: ${JSON.stringify(data.chatAnalysis.avgResponseTime)}
감정 점수: ${data.chatAnalysis.sentimentScore}/100
연애 온도: ${data.chatAnalysis.loveTemperature}°
자주 나눈 대화 주제: ${JSON.stringify(data.chatAnalysis.topTopics)}
` : ""}

위 데이터를 바탕으로 다음을 종합 분석해주세요:

1. **오행 궁합 심층 해석**: 일간 관계, 조후 용신, 상생/상극을 비유와 함께 상세 설명. 단순 "좋다/나쁘다"가 아닌, 왜 끌리는지/갈등이 생기는지 원리를 설명
2. **십성으로 본 관계 역학**: 상대가 나에게 어떤 십성인지, 관계에서의 역할 분배
3. **카톡 패턴이 말해주는 관계의 온도**: 대화량, 응답속도, 감정어 비율로 관계 역학 분석 (데이터 있는 경우)
4. **이 연애가 무덤에 들어간 이유 (추정)**: 오행/대화패턴에서 유추되는 갈등 요인
5. **무덤에서 건진 교훈**: 다음 연애에서 어떤 오행의 사람을 만나면 좋을지, 주의할 점`
}

function buildComparisonPrompt(
  graveA: { nickname: string; manseryeok?: unknown; compatibility?: unknown; chatAnalysis?: unknown },
  graveB: { nickname: string; manseryeok?: unknown; compatibility?: unknown; chatAnalysis?: unknown }
): string {
  return `"연애 공동묘지"에 묻힌 두 과거 연인을 비교 분석해주세요.

[첫 번째 묘비: ${graveA.nickname}]
${graveA.manseryeok ? `만세력: ${JSON.stringify(graveA.manseryeok)}` : "만세력 정보 없음"}
${graveA.compatibility ? `궁합: ${JSON.stringify(graveA.compatibility)}` : ""}
${graveA.chatAnalysis ? `카톡 분석: ${JSON.stringify(graveA.chatAnalysis)}` : ""}

[두 번째 묘비: ${graveB.nickname}]
${graveB.manseryeok ? `만세력: ${JSON.stringify(graveB.manseryeok)}` : "만세력 정보 없음"}
${graveB.compatibility ? `궁합: ${JSON.stringify(graveB.compatibility)}` : ""}
${graveB.chatAnalysis ? `카톡 분석: ${JSON.stringify(graveB.chatAnalysis)}` : ""}

다음을 비교 분석해주세요:

1. **두 무덤의 주인, 얼마나 달랐나**: 두 사람의 일간/오행 비교, 성격 차이를 비유로 설명
2. **나와의 케미 비교**: 각각의 궁합을 비유적으로 비교 (어떤 조합이 왜 더 잘/안 맞았는지)
3. **카톡으로 본 연애 온도 변화**: 대화 패턴 차이에서 드러나는 관계 역학 차이
4. **내 연애 패턴 진단**: 두 연애에서 반복되는 나의 패턴 (같은 타입에 끌리는지, 같은 이유로 헤어지는지)
5. **다음 연인의 이상적 사주**: 과거 패턴을 기반으로 어떤 오행 조합의 사람을 만나면 좋을지`
}
