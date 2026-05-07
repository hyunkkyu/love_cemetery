import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { auth } from "@/lib/auth"
import mongoose from "mongoose"

const FeedbackSchema = new mongoose.Schema({
  userId: String,
  nickname: String,
  message: String,
}, { timestamps: true })

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema)

export const maxDuration = 30

const MASTER_NAME = "금빛샤인"

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || ""

  await connectDB()
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const { action } = body

  if (action === "list") {
    // 마스터만 전체 피드백 조회 가능
    if (userName !== MASTER_NAME) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100).lean()
    return NextResponse.json({ data: feedbacks.map((f) => ({ ...f, _id: undefined, id: String(f._id) })) })
  }

  if (action === "send") {
    if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
    const message = String(body.message || "").trim().slice(0, 1000)
    if (!message) return NextResponse.json({ error: "메시지를 입력해주세요" }, { status: 400 })
    await Feedback.create({ userId, nickname: userName, message })
    return NextResponse.json({ ok: true })
  }

  if (action === "delete") {
    if (userName !== MASTER_NAME) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }
    await Feedback.deleteOne({ _id: body.message })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}
