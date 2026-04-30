import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { Grave, UserData } from "@/lib/db/models"
import { SajuProfile } from "@/lib/db/community-models"
import { auth } from "@/lib/auth"
import { callLLM } from "@/lib/llm"
import mongoose from "mongoose"

export const maxDuration = 60

const FREE_LIMIT = 3 // 하루 무료 3회
const COIN_COST = 20 // 이후 1회당 20코인

// 상담 기록 스키마
const CounselSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  coinUsed: { type: Number, default: 0 },
}, { timestamps: true })

const Counsel = mongoose.models.Counsel || mongoose.model("Counsel", CounselSchema)

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || "익명"
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })

  await connectDB()
  const { action } = body

  try {
    switch (action) {
      case "counsel.history": {
        const history = await Counsel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        return NextResponse.json({
          data: history.map((h) => {
            const doc = h as Record<string, unknown>
            return { id: String(doc._id), question: doc.question, answer: doc.answer, coinUsed: doc.coinUsed, createdAt: doc.createdAt }
          }),
        })
      }

      case "counsel.status": {
        // 오늘 무료 사용 횟수 확인
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayCount = await Counsel.countDocuments({
          userId,
          coinUsed: 0,
          createdAt: { $gte: todayStart },
        })
        const user = await UserData.findOne({ userId }).lean()
        const coins = (user as Record<string, unknown>)?.coins as number || 0
        return NextResponse.json({
          data: {
            freeRemaining: Math.max(0, FREE_LIMIT - todayCount),
            freeLimit: FREE_LIMIT,
            coinCost: COIN_COST,
            coins,
            totalCounsels: await Counsel.countDocuments({ userId }),
          },
        })
      }

      case "counsel.ask": {
        const question = String(body.question || "").trim()
        if (!question || question.length < 5) {
          return NextResponse.json({ error: "질문을 5자 이상 입력해주세요" }, { status: 400 })
        }

        // 무료 횟수 확인
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayFreeCount = await Counsel.countDocuments({
          userId,
          coinUsed: 0,
          createdAt: { $gte: todayStart },
        })
        const isFree = todayFreeCount < FREE_LIMIT
        let coinUsed = 0

        if (!isFree) {
          // 코인 차감 (원자적)
          const result = await UserData.findOneAndUpdate(
            { userId, coins: { $gte: COIN_COST } },
            { $inc: { coins: -COIN_COST } },
            { returnDocument: "after" }
          )
          if (!result) {
            return NextResponse.json({
              error: "코인이 부족합니다. 오늘 무료 " + FREE_LIMIT + "회를 모두 사용했어요. (1회 " + COIN_COST + "코인)",
            }, { status: 400 })
          }
          coinUsed = COIN_COST
        }

        // 유저 데이터 수집
        const [graves, profile] = await Promise.all([
          Grave.find({ userId }).lean(),
          SajuProfile.findOne({ userId }).lean(),
        ])

        const graveSummary = graves.length > 0
          ? graves.map((g) => {
              const doc = g as Record<string, unknown>
              return `- ${doc.nickname}: 사인=${doc.causeOfDeath || "미상"}, 사연=${(doc.graveReason as string || "").slice(0, 100)}, 궁합=${(doc.compatibility as Record<string, unknown>)?.score || "?"}점`
            }).join("\n")
          : "등록된 묘비 없음"

        const profileInfo = profile
          ? `MBTI: ${(profile as Record<string, unknown>).mbti || "미등록"}, 일주: ${(profile as Record<string, unknown>).ilju || "미등록"}, 지배오행: ${(profile as Record<string, unknown>).dominantElement || "미등록"}`
          : "사주 프로필 미등록"

        // 최근 상담 맥락
        const recentCounsels = await Counsel.find({ userId }).sort({ createdAt: -1 }).limit(3).lean()
        const contextText = recentCounsels.length > 0
          ? recentCounsels.reverse().map((c) => {
              const doc = c as Record<string, unknown>
              return `Q: ${(doc.question as string).slice(0, 100)}\nA: ${(doc.answer as string).slice(0, 200)}`
            }).join("\n\n")
          : ""

        const prompt = `너는 "명예의전당" 앱의 전문 연애 상담사야. ${userName}님이 상담을 요청했어.

[${userName}님의 정보]
${profileInfo}

[과거 연애 기록 (묘비)]
${graveSummary}

${contextText ? `[이전 상담 맥락]\n${contextText}\n` : ""}

[오늘의 질문]
${question}

다음 원칙으로 상담해줘:
1. 사주/만세력 데이터가 있으면 오행 관점에서도 분석
2. 과거 연애 패턴을 참고하여 반복되는 문제인지 진단
3. 공감 먼저, 그 다음 솔직한 조언
4. 구체적이고 실행 가능한 액션 플랜 제시
5. 필요하면 뼈때리는 직언도 (단, 따뜻한 톤으로)
6. 500~800자로 답변`

        const answer = await callLLM(prompt)

        // 상담 기록 저장
        await Counsel.create({ userId, question, answer, coinUsed })

        return NextResponse.json({
          data: { answer, coinUsed, freeRemaining: isFree ? Math.max(0, FREE_LIMIT - todayFreeCount - 1) : 0 },
        })
      }

      case "counsel.delete": {
        await Counsel.deleteOne({ _id: body.counselId, userId })
        return NextResponse.json({ data: true })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
