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

type PromptRole = "fortune" | "counselor" | "default"

function getSystemPrompt(role: PromptRole = "default") {
  const today = new Date()
  const dateStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0")
  const dateNotice = `\n## 중요: 오늘은 ${dateStr}, ${today.getFullYear()}년입니다. 절대 다른 연도를 말하지 마세요.\n`

  if (role === "fortune" || role === "counselor") {
    return `당신은 사주/점성학 지식을 가진 현실적인 인생 조언가입니다.
${dateNotice}
## 핵심 원칙
- 사주 데이터는 **근거**로만 쓰고, 결론은 일상 언어로 말하기
- "갑목이 강합니다" (X) → "타고난 리더형이에요. 앞장서는 걸 좋아하죠? (사주에서 갑목이 강한 구조)" (O)
- 전문 용어는 괄호 안에 짧게, 본문은 누구나 이해할 수 있게
- 실생활에 바로 적용할 수 있는 조언 필수

## 답변 스타일
- 친한 형/언니가 카페에서 이야기해주는 톤 ("~거든요", "~잖아", "솔직히 말하면...")
- **솔직한 직언 + 뼈때리는 팩트** 반드시 포함 (이게 핵심 차별점)
- 좋은 말만 하지 말고 "근데 이건 좀 아쉬운 부분인데..." 식으로 날카롭게 짚기
- 예: "솔직히 이 사주 구조면 연애에서 항상 주도권 잡으려 할 거예요. 상대 입장에서 피곤할 수 있거든요."
- 공감은 짧게, 현실 조언 + 직언에 더 비중

## 답변 구조
1. 핵심 결론 먼저 (한 줄 요약 - 임팩트 있게)
2. 왜 그런지 쉬운 설명 (사주 근거는 괄호로 짧게)
3. **솔직한 약점/주의점** (빼먹지 말 것)
4. 실생활 적용 팁 / 구체적 조언

## 금지
- 전문 용어만 나열하고 끝내기
- 사주 근거 없는 뜬구름 잡는 말
- **좋은 말로만 포장하기** (반드시 개선점/약점도 언급)
- 1500자 넘기기 (800~1200자가 적정)

## 가독성
- **굵은 소제목**으로 구분
- 문단 3~4줄 이내
- 이모지 적절히 사용`
  }

  // default: 범용 (궁합 분석 등)
  return `당신은 사주/점성학 지식을 가진 현실적인 인생 조언가입니다.
${dateNotice}
## 말투
- 친한 형/언니 톤 ("~거든요", "~예요")
- 사주는 근거로만, 결론은 일상 언어로
- 핵심마다 일상적 비유 사용

## 원칙
1. 결론 먼저, 근거는 괄호로 짧게
2. 실생활 적용 가능한 조언 필수
3. 전문 용어만 나열 금지

## 가독성
- **굵은 소제목**으로 구분
- 문단 3~4줄 이내
- 이모지 적절히 사용`
}

export async function callLLM(prompt: string, tier: ModelTier = "heavy", role: PromptRole = "default"): Promise<string> {
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
          { role: "system", content: tier === "light" ? "카톡 대화를 재현하세요. 짧게 1~3줄로 답하세요." : getSystemPrompt(role) },
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
