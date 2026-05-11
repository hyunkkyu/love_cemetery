import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { SsumBung } from "@/lib/db/models"
import { auth } from "@/lib/auth"
import { callLLM } from "@/lib/llm"

export const maxDuration = 60

function serialize(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc
  return { id: String(_id), ...rest }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })

  await connectDB()
  const { action } = body

  try {
    switch (action) {
      case "ssum.list": {
        const list = await SsumBung.find({ userId }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ data: list.map(serialize) })
      }

      case "ssum.get": {
        const doc = await SsumBung.findOne({ _id: body.ssumId, userId }).lean()
        return NextResponse.json({ data: doc ? serialize(doc as Record<string, unknown>) : null })
      }

      case "ssum.save": {
        const { ssum } = body as { ssum: Record<string, unknown> }
        if (!ssum || !ssum.nickname) return NextResponse.json({ error: "닉네임은 필수입니다" }, { status: 400 })

        const { id: ssumId, ...ssumData } = ssum

        if (ssumId) {
          const existing = await SsumBung.findOne({ _id: ssumId, userId }).catch(() => null)
          if (existing) {
            Object.assign(existing, { ...ssumData, userId })
            await existing.save()
            return NextResponse.json({ data: serialize(existing.toObject()) })
          }
        }
        const doc = await SsumBung.create({ ...ssumData, userId })
        return NextResponse.json({ data: serialize(doc.toObject()) })
      }

      case "ssum.delete": {
        await SsumBung.deleteOne({ _id: body.ssumId, userId })
        return NextResponse.json({ data: true })
      }

      case "ssum.analyze": {
        const doc = await SsumBung.findOne({ _id: body.ssumId, userId }).lean()
        if (!doc) return NextResponse.json({ error: "데이터를 찾을 수 없습니다" }, { status: 404 })
        const s = doc as Record<string, unknown>
        const factLevel = Number(body.factLevel) || 3 // 1(순한맛)~5(극강 팩폭)

        // 웹에서 연애 조언 검색
        let webAdvice = ""
        try {
          const searchQuery = encodeURIComponent("연애 썸 거절당했을때 현실적 조언 " + (s.myOpinion || ""))
          const searchRes = await fetch(
            "https://www.googleapis.com/customsearch/v1?key=" + (process.env.GOOGLE_SEARCH_KEY || "") +
            "&cx=" + (process.env.GOOGLE_SEARCH_CX || "") +
            "&q=" + searchQuery + "&num=3&lr=lang_ko",
            { signal: AbortSignal.timeout(5000) }
          )
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            const items = searchData.items || []
            webAdvice = items.map((item: { title: string; snippet: string }) =>
              item.title + ": " + item.snippet
            ).join("\n")
          }
        } catch { /* 검색 실패해도 계속 진행 */ }

        const factToneMap: Record<number, string> = {
          1: `공감 90% + 조언 10%.
"많이 힘들었겠다..."로 시작. 상대 탓을 먼저 하고, 본인 문제는 거의 언급 안 함.
"다음엔 더 좋은 사람 만날 거야" 식으로 마무리.
예시 톤: "그건 상대가 좀 이상했던 거야. 네가 못해서가 아니야."`,

          2: `공감 70% + 조언 30%.
위로하면서도 슬쩍 현실 지적. "혹시 이런 건 아니었을까?" 식으로 조심스럽게.
본인의 행동도 약간 돌아보게 하되, 상처 주지 않게.
예시 톤: "충분히 속상했을 텐데... 근데 혹시 연락 너무 자주 한 건 아니었을까?"`,

          3: `공감 50% + 팩트 50%.
위로와 현실을 균형있게. 상대 문제도 내 문제도 똑같이 분석.
"솔직히 이 부분은..." 으로 팩트를 던지되 부드럽게.
예시 톤: "마음은 이해하는데, 솔직히 상대 입장에서 보면 부담스러웠을 수도 있어."`,

          4: `공감 20% + 팩트 80%.
거의 직설. "이건 좀 아니었어", "솔직히 말하면..." 으로 시작.
본인이 인정하기 싫은 현실도 정면으로 지적. 단, 인격 모욕은 안 함.
매력도, 대화 스킬, 타이밍 실수 등 구체적으로 지적.
예시 톤: "솔직히 말하면 그 타이밍에 고백한 건 너무 성급했어. 상대가 부담 느꼈을 거야."`,

          5: `공감 5% + 팩트 95%. 극한의 직설.
친한 친구가 술 3잔 마시고 하는 수준. "야 진짜 솔직히 말할게..."로 시작.
외모, 매력, 대화법, 연애 센스 등 듣기 싫은 진실도 거침없이.
"상대 입장에서 너는 이렇게 보였을 거야"까지 직격.
단, 마지막에는 "근데 이걸 알아야 다음에 안 망해" 식으로 성장 방향 제시.
예시 톤: "야 솔직히 말할게. 그 사람이 안 만나준 건 네가 재미없었기 때문이야. 대화할 때 너무 질문만 하고 리액션이 없었을 거거든."`,
        }

        const prompt = `"명예의전당" 앱의 "썸붕 분석" 요청입니다.

[썸 상대: ${s.nickname}]
성격/MBTI: ${s.persona || "미입력"}
썸 기간: ${s.duration || "미입력"}
만남 경위: ${s.howWeMet || "미입력"}
${s.manseryeok ? `상대 만세력: ${JSON.stringify((s.manseryeok as Record<string, unknown>)?.summary || s.manseryeok)}` : ""}
${s.myManseryeok ? `나의 만세력: ${JSON.stringify((s.myManseryeok as Record<string, unknown>)?.summary || s.myManseryeok)}` : ""}
${s.compatibility ? `궁합: ${JSON.stringify(s.compatibility)}` : ""}

[내가 생각하는 썸붕 이유]
${s.myOpinion || "미입력"}

[감지된 썸붕 징후들]
${Array.isArray(s.signals) && s.signals.length > 0 ? (s.signals as string[]).join(", ") : "미입력"}

[마지막 연락]
${s.lastMessage || "미입력"}

${webAdvice ? `[참고: 연애 전문가/커뮤니티 의견]\n${webAdvice}\n` : ""}

## 팩폭 레벨: ${factLevel}/5
${factToneMap[factLevel] || factToneMap[3]}

## 분석 형식 (두 파트로 나눠서)

### 파트1: 🔮 사주/운명학 관점
1. 객관적 썸붕 원인 진단 (사주/궁합 기반)
2. 이 사람과의 가능성 판단

### 파트2: 💣 연애 고수의 현실 조언
팩폭 레벨 ${factLevel}/5에 맞춰서:
- 사주 같은 거 빼고, 순수하게 연애 경험과 현실 관점에서 분석
- "솔직히 상대 입장에서 보면..." 으로 상대 시점도 분석
- 본인이 인정하기 싫지만 사실일 수 있는 원인들
- 외모, 매력, 대화 스킬, 타이밍, 밀당 실수 등 현실적 요소
- 실제 연애 커뮤니티에서 나올 법한 직설적 피드백
${factLevel >= 4 ? "- 듣기 싫은 진실도 과감하게 말하기" : ""}
${factLevel >= 5 ? "- '야 솔직히...' 수준으로 거침없이. 단, 마지막엔 응원으로 마무리" : ""}

### 마지막: 💪 다음 썸 실전 전략
구체적이고 실행 가능한 액션 플랜 3~5개`

        const analysis = await callLLM(prompt, "medium")

        await SsumBung.updateOne({ _id: body.ssumId }, { $set: { aiAnalysis: analysis } })

        return NextResponse.json({ data: analysis })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
