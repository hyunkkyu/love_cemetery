import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import mongoose from "mongoose"

const FeedbackSchema = new mongoose.Schema({
  userId: String,
  nickname: String,
  message: String,
}, { timestamps: true })

const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema)

export const maxDuration = 30

export async function POST(request: NextRequest) {
  await connectDB()
  const { action, userId, nickname, message } = await request.json()

  if (action === "list") {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100).lean()
    return NextResponse.json({ data: feedbacks.map((f) => ({ ...f, _id: undefined, id: String(f._id) })) })
  }

  if (action === "send") {
    await Feedback.create({ userId, nickname, message })
    return NextResponse.json({ ok: true })
  }

  if (action === "delete") {
    await Feedback.deleteOne({ _id: message })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}
