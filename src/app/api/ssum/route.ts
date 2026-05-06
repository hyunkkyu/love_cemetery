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

다음 관점으로 분석해주세요:

1. **🔍 객관적 썸붕 원인 진단**: 본인이 말한 이유 vs 실제 원인이 다를 수 있음. 사주/궁합 데이터와 정황을 종합해서 객관적으로 분석
2. **💡 본인이 놓친 신호**: 썸붕 징후에서 미리 알아챌 수 있었던 것들
3. **🪞 자기 객관화**: 혹시 본인에게도 원인이 있었는지 솔직하게 (따뜻한 톤으로)
4. **🔮 이 사람과 가능성**: 사주 궁합상 원래 안 맞는 건지, 타이밍 문제인지, 다시 시도해볼 만한지
5. **💪 다음 썸을 위한 조언**: 같은 실수를 반복하지 않으려면 어떻게 해야 하는지

공감하되 뼈때리는 직언도 섞어주세요. "~거든요" 같은 다정한 구어체로.`

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
