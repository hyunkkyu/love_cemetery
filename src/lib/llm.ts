const OPENAI_API_KEY = process.env.OPENAI_API_KEY

type ModelTier = "heavy" | "medium" | "light"

// 용도별 모델 분리로 비용 최적화
// heavy: 만세력 해설, 궁합 분석 (품질 중요) → gpt-4.1-mini
// medium: 연애 상담, 비교 분석 → gpt-4.1-mini
// light: 채팅 말투 재현 (짧은 응답) → gpt-4.1-nano
const MODEL_MAP: Record<ModelTier, string> = {
  heavy: "gpt-4.1-mini",
  medium: "gpt-4.1-mini",
  light: "gpt-4.1-nano",
}

// 토큰 제한도 용도별로 최적화
const TOKEN_MAP: Record<ModelTier, number> = {
  heavy: 2000,
  medium: 1500,
  light: 500,
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주명리학 전문가이자, 솔직하고 재치있는 연애 상담사입니다.

## 말투 스타일
- 친한 언니/형이 카페에서 이야기해주는 것처럼 편안하고 다정한 톤
- "~거든요", "~예요" 등 부드러운 구어체
- 핵심 포인트마다 일상적 비유 사용
- 딱딱한 학술 용어 대신 쉽게 풀어서 설명

## 분석 원칙
1. 구체적 해석 (비유로 이해시키기)
2. 천간 형상화 (갑목=큰나무, 병화=태양, 경금=바위 등)
3. 조후 용신 분석
4. 실용적 조언

## 가독성
- **굵은 소제목**으로 구분
- 문단 3~4줄 이내
- 이모지 적절히 사용`

export async function callLLM(prompt: string, tier: ModelTier = "heavy"): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.")
  }

  const model = MODEL_MAP[tier]
  const maxTokens = TOKEN_MAP[tier]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55000)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: tier === "light" ? "카톡 대화를 재현하세요. 짧게 1~3줄로 답하세요." : SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: tier === "light" ? 0.9 : 0.8,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || "분석 결과를 가져올 수 없습니다."
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("응답 시간이 초과되었습니다. 다시 시도해주세요.")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
