import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"
import { connectDB } from "@/lib/db/mongoose"
import { AiLog } from "@/lib/db/models"
import { auth } from "@/lib/auth"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const uid = (session?.user as { id?: string })?.id
    if (!uid) return NextResponse.json({ interpretation: "⚠️ 로그인이 필요한 기능입니다." }, { status: 401 })
    const { checkRateLimit } = await import("@/lib/rate-limit")
    if (!checkRateLimit(uid, 5, 60000)) return NextResponse.json({ interpretation: "⚠️ 너무 많은 요청입니다. 1분 후 다시 시도해주세요." }, { status: 429 })
    const body = await request.json()
    const { manseryeok, birthDate, gender, name, category, question } = body
    const genderLabel = gender === "M" ? "남성" : gender === "F" ? "여성" : "미입력"

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

    const prompt = `아래 사주/운명학 데이터를 바탕으로, 일상 언어로 쉽게 분석해주세요.
전문 용어는 괄호 안에만 짧게, 본문은 누구나 알아들을 수 있게.

[기본 정보]
${name ? `이름: ${name}` : ""}
성별: ${genderLabel}
생년월일: ${birthDate || "미입력"}

[성별 참고]
${gender === "M" ? "남성 → 재성=연애상대, 관성=직장/권위" : gender === "F" ? "여성 → 관성=연애상대, 재성=재물" : "성별 미입력"}

[사주 데이터]
${manseryeok?.summary || "데이터 없음"}
오행 분포: ${JSON.stringify(manseryeok?.elementBalance || {})}
지배 오행: ${manseryeok?.dominantElement || "미상"}

[추가 참고 데이터]
- 생명경로수: ${lifePathNumber || "계산 불가"}
- 태양 별자리: ${zodiacSign || "계산 불가"}
- 본명성(구궁수): ${kuaNumber || "계산 불가"}
${name ? `- 이름 "${name}"의 수리성명학적 의미도 참고` : ""}

${focusArea ? `[집중 분석 주제]: ${focusArea}` : ""}
${question ? `[사용자 질문]: ${question}` : ""}

## 답변 규칙

1. **결론 먼저** → 왜 그런지 쉬운 설명 → 실생활 적용 팁
2. 사주 근거는 괄호로 짧게: "결단력이 강해요 (경금 일간)"
3. 여러 학문이 같은 결론을 가리키면 "사주와 점성학 모두 ~를 가리킵니다" 식으로 신뢰도 강조
4. 실생활 조언 필수 ("이번 달에는...", "연애할 때는...", "직장에서는...")
5. 800~1200자 적정, 넘기지 마세요

## 형식
- **굵은 소제목**으로 구분 (이모지 + 주제)
- 학문별이 아니라 **주제별**로 구성 (성격, 연애, 직업, 올해운세 등)
- 마지막에 **🔮 종합 결론 & 실전 조언** 필수`

    const interpretation = await callLLM(prompt, "heavy", "fortune")

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
