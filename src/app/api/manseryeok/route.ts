import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"
import { connectDB } from "@/lib/db/mongoose"
import { AiLog } from "@/lib/db/models"
import { auth } from "@/lib/auth"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { manseryeok, birthDate, name, category, question } = body

    // 생년월일에서 수비학/점성학 정보 추출
    const [year, month, day] = (birthDate || "").split("-").map(Number)
    const lifePathNumber = calculateLifePath(year, month, day)
    const zodiacSign = getZodiacSign(month, day)
    const kuaNumber = calculateKua(year, month, day)

    // 분석 범위 결정
    let focusArea = ""
    if (category) {
      const categories: Record<string, string> = {
        love: "연애운/결혼운/이상형/연애 시기",
        career: "직업적성/재물운/사업운/투자운",
        health: "체질/건강 취약점/양생법",
        personality: "내면 성격/무의식 패턴/숨은 재능",
        timing: "올해 운세/전환기/주의 시기/대운 흐름",
        relation: "대인관계 패턴/궁합 유형/인연의 특징",
      }
      focusArea = categories[category] || ""
    }

    const prompt = `당신은 동양/서양 운명학을 모두 마스터한 종합 운명 분석가입니다.
아래 6가지 학문으로 교차검증하여 분석해주세요.

[기본 정보]
${name ? `이름: ${name}` : ""}
생년월일: ${birthDate || "미입력"}

[1. 사주명리학 데이터]
${manseryeok?.summary || "데이터 없음"}
오행 분포: ${JSON.stringify(manseryeok?.elementBalance || {})}
지배 오행: ${manseryeok?.dominantElement || "미상"}

[2. 자미두수]
생년월일시를 기반으로 자미두수 명반의 주요 궁(命宮, 財帛宮, 夫妻宮 등)을 추론하여 분석해주세요.

[3. 수비학 (Numerology)]
생명경로수(Life Path Number): ${lifePathNumber || "계산 불가"}
${name ? `이름 수리: "${name}"의 획수와 수리성명학적 의미를 분석해주세요.` : ""}

[4. 서양 점성학]
태양 별자리: ${zodiacSign || "계산 불가"}
생년월일 기반으로 주요 행성 배치를 추론하여 분석해주세요.

[5. 구성기학 (九星氣學)]
본명성(구궁수): ${kuaNumber || "계산 불가"}
길방/흉방, 올해의 기운 흐름을 분석해주세요.

[6. 수리성명학]
${name ? `"${name}"의 천격/인격/지격/외격/총격을 분석해주세요.` : "이름 미입력 - 사주 기반 분석만 진행"}

${focusArea ? `\n[집중 분석 주제]: ${focusArea}` : ""}
${question ? `\n[사용자 질문]: ${question}` : ""}

## 분석 형식

${focusArea || question ? `요청된 주제/질문에 집중하되, 6가지 학문의 관점에서 교차검증하세요.` : `전체 종합 분석을 해주세요.`}

각 학문의 분석이 **일치하는 점**과 **다른 점**을 명확히 언급하고,
교차검증을 통해 **가장 신뢰도 높은 결론**을 도출해주세요.

형식:
- 각 학문별 소제목으로 구분 (이모지 + 학문명)
- 마지막에 **🔮 교차검증 종합 결론** 필수
- 실용적 조언 포함
- 1500자 이상 상세하게`

    const interpretation = await callLLM(prompt, "heavy")

    try {
      await connectDB()
      const session = await auth()
      const userId = (session?.user as { id?: string })?.id
      await AiLog.create({ userId, type: "manseryeok", input: { birthDate, name, category, question }, output: interpretation, model: "gpt-4.1-mini" })
    } catch { /* 저장 실패해도 결과는 반환 */ }

    return NextResponse.json({ interpretation })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "분석 중 오류"
    return NextResponse.json({ interpretation: "⚠️ " + msg }, { status: 500 })
  }
}

// 수비학: 생명경로수 계산
function calculateLifePath(y: number, m: number, d: number): number | null {
  if (!y || !m || !d) return null
  const sum = String(y) + String(m) + String(d)
  let total = 0
  for (const ch of sum) total += parseInt(ch)
  while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
    let next = 0
    for (const ch of String(total)) next += parseInt(ch)
    total = next
  }
  return total
}

// 점성학: 태양 별자리
function getZodiacSign(m: number, d: number): string | null {
  if (!m || !d) return null
  const signs = [
    [1, 20, "물병자리"], [2, 19, "물고기자리"], [3, 21, "양자리"], [4, 20, "황소자리"],
    [5, 21, "쌍둥이자리"], [6, 21, "게자리"], [7, 23, "사자자리"], [8, 23, "처녀자리"],
    [9, 23, "천칭자리"], [10, 23, "전갈자리"], [11, 22, "사수자리"], [12, 22, "염소자리"],
  ] as [number, number, string][]
  for (let i = signs.length - 1; i >= 0; i--) {
    if (m === signs[i][0] && d >= signs[i][1]) return signs[i][2]
    if (m === signs[i][0] + 1 && d < signs[(i + 1) % 12][1]) return signs[i][2]
  }
  if (m === 1 && d < 20) return "염소자리"
  return signs[m - 1]?.[2] || null
}

// 구성기학: 본명성 계산
function calculateKua(y: number, m: number, d: number): number | null {
  if (!y) return null
  // 입춘 전이면 전년도
  const adjustedYear = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y
  let sum = 0
  for (const ch of String(adjustedYear)) sum += parseInt(ch)
  while (sum > 9) {
    let next = 0
    for (const ch of String(sum)) next += parseInt(ch)
    sum = next
  }
  return ((11 - sum) % 9) || 9
}
