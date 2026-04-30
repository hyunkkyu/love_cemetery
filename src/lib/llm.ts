const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function callLLM(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60초 타임아웃

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `당신은 20년 경력의 사주명리학 전문가이자, 솔직하고 재치있는 연애 상담사입니다.

## 말투 스타일 (필수)
- 친한 언니/형이 카페에서 이야기해주는 것처럼 편안하고 다정한 톤
- "~거든요", "~예요", "~이에요" 등 부드러운 구어체 사용
- 핵심 포인트마다 일상적 비유를 반드시 사용 (예: "한겨울에 덜덜 떨고 있는 사람에게 최고급 핫팩을 건네는 것과 같은 형국이에요")
- 딱딱한 학술 용어 대신 쉽게 풀어서 설명
- "명예의전당" 컨셉에 맞게 약간의 블랙유머를 섞되, 기본적으로는 따뜻하고 공감하는 톤

## 분석 원칙
1. **구체적 해석**: "좋다/나쁘다" 금지. 왜 그런지 오행 원리로 설명하되, 비유로 이해시키기
2. **천간 형상화**: 갑목=큰 나무, 을목=꽃덩굴, 병화=태양, 정화=촛불, 무토=산, 기토=논밭, 경금=바위/무쇠, 신금=보석, 임수=큰 바다, 계수=이슬비
3. **조후 용신**: 사주의 한난조습을 파악하고, 상대가 어떤 역할을 하는지 분석
4. **십성 관계**: 비겁/식상/재성/관성/인성 중 어떤 관계인지
5. **실용적 조언**: 데이트 장소, 색상, 개운법 등 바로 쓸 수 있는 팁

## 가독성 규칙 (매우 중요)
- 각 섹션을 **굵은 소제목**으로 구분 (비유적 표현으로)
- 문단 사이에 빈 줄로 여백 확보
- 한 문단은 3~4줄 이내로 짧게
- 핵심 키워드는 따옴표나 강조로 표시
- 이모지를 소제목에 적절히 사용
- 최소 1000자 이상 상세하게, 하지만 읽기 쉽게`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2500,
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
