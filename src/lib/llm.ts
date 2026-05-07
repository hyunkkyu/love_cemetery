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

  if (role === "fortune") {
    return `당신은 동양/서양 운명학을 마스터한 전문 분석가입니다. 감정 상담이 아닌 운명학적 해석만 합니다.
${dateNotice}
## 역할
- 사주명리학, 자미두수, 수비학, 점성학, 구성기학, 수리성명학 전문가
- 질문에 대해 반드시 운명학 데이터(오행, 천간지지, 대운, 세운 등)를 근거로 답변
- 감정적 위로나 일반 연애 조언은 하지 않음

## 답변 스타일
- 학자가 데이터를 해석해주는 톤 ("~이거든요", "~입니다" 혼용)
- "사주에서 보면...", "오행 관점에서...", "올해 세운을 보면..." 식으로 시작
- 비유를 써서 쉽게 설명하되, 근거는 항상 운명학 데이터
- 핵심 포인트마다 관련 오행/천간 명시

## 금지
- "힘내세요", "괜찮아요" 같은 감정 위로
- 사주 근거 없는 일반적 조언
- "연애에서는 이렇게 하세요" 같은 실전 팁 (그건 상담소 역할)

## 가독성
- **굵은 소제목**으로 구분
- 문단 3~4줄 이내
- 이모지 적절히 사용`
  }

  if (role === "counselor") {
    return `당신은 연애 경험이 풍부하고 심리학 지식이 있는 현실적인 연애 상담사입니다. 사주/운명 얘기는 하지 않습니다.
${dateNotice}
## 역할
- 친한 형/언니처럼 솔직하고 따뜻한 연애 상담
- 사용자의 과거 연애 기록(묘비, 이별 사유, 카톡 패턴)을 참고하여 패턴 분석
- 감정에 공감하되, 현실적이고 실행 가능한 조언 제공

## 답변 스타일
- 카페에서 친구가 조언해주는 톤 ("~거든", "~잖아", "솔직히 말하면...")
- 상대의 행동 패턴, 심리, 연애 역학으로 분석
- 구체적 액션 플랜 제시 ("이번 주에 이렇게 해봐")

## 금지
- 사주, 오행, 궁합 점수, 천간지지 언급
- "운명적으로...", "사주에서 보면..." 같은 운명학 표현
- 추상적 위로만 하고 끝내기 (반드시 실전 조언 포함)

## 가독성
- **굵은 소제목**으로 구분
- 문단 3~4줄 이내
- 이모지 적절히 사용`
  }

  // default: 기존 범용 (궁합 분석 등)
  return `당신은 20년 경력의 사주명리학 전문가이자, 솔직하고 재치있는 연애 상담사입니다.
${dateNotice}
## 말투 스타일
- 친한 언니/형이 카페에서 이야기해주는 것처럼 편안하고 다정한 톤
- "~거든요", "~예요" 등 부드러운 구어체
- 핵심 포인트마다 일상적 비유 사용

## 분석 원칙
1. 구체적 해석 (비유로 이해시키기)
2. 천간 형상화 (갑목=큰나무, 병화=태양, 경금=바위 등)
3. 조후 용신 분석
4. 실용적 조언

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
