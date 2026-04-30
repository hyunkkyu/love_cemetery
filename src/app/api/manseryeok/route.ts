import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { manseryeok } = await request.json()

    const prompt = `아래 사주팔자를 상세하게 해설해주세요.

${manseryeok.summary}
오행 분포: ${JSON.stringify(manseryeok.elementBalance)}
지배 오행: ${manseryeok.dominantElement}

다음 항목을 각각 소제목(비유적 표현)과 함께 상세히 분석해주세요:

1. **일간의 본질**: 이 사람은 어떤 존재인가 (천간의 형상과 성격을 비유로)
2. **오행 밸런스 진단**: 넘치는 기운과 부족한 기운, 그로 인한 성격/행동 패턴
3. **조후 분석**: 사주의 한난조습 상태, 어떤 기운이 보완되면 좋은지
4. **연애 성향**: 이 사주가 연애에서 보이는 특징, 끌리는 타입, 주의할 점
5. **대인관계 & 직업운**: 간략한 사회생활 특성
6. **개운 포인트**: 부족한 오행을 채울 수 있는 색상, 방향, 음식, 취미 등 실용적 조언

전문 명리학 지식을 바탕으로 하되, 일반인도 이해할 수 있게 재치있는 비유를 활용해주세요.`

    const interpretation = await callLLM(prompt)
    return NextResponse.json({ interpretation })
  } catch (error) {
    const message = error instanceof Error ? error.message : "해설 중 오류가 발생했습니다."
    return NextResponse.json({ interpretation: `⚠️ ${message}` }, { status: 500 })
  }
}
