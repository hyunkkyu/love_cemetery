import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { User } from "@/lib/db/models"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export const maxDuration = 30

const SECURITY_QUESTIONS = [
  "첫사랑의 이름은?",
  "가장 좋아하는 노래 제목은?",
  "어릴 때 살던 동네 이름은?",
  "반려동물 이름은?",
  "가장 기억에 남는 여행지는?",
  "좋아하는 음식은?",
]

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  await connectDB()
  const { action } = body

  try {
    switch (action) {
      case "register": {
        const nickname = String(body.nickname || "").trim()
        const password = String(body.password || "")
        const securityQuestion = String(body.securityQuestion || "")
        const securityAnswer = String(body.securityAnswer || "").trim().toLowerCase()

        // 닉네임 검증
        if (nickname.length < 2 || nickname.length > 12) {
          return NextResponse.json({ error: "닉네임은 2~12자여야 합니다" }, { status: 400 })
        }
        if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
          return NextResponse.json({ error: "닉네임은 한글/영문/숫자만 가능합니다" }, { status: 400 })
        }

        // 비밀번호 검증
        if (password.length < 8) {
          return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다" }, { status: 400 })
        }
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
          return NextResponse.json({ error: "비밀번호에 영문과 숫자를 모두 포함해주세요" }, { status: 400 })
        }

        // 보안 질문 검증
        if (!securityQuestion || !securityAnswer) {
          return NextResponse.json({ error: "비밀번호 찾기용 질문과 답변을 입력해주세요" }, { status: 400 })
        }

        // 닉네임 중복 체크
        const existing = await User.findOne({ nickname })
        if (existing) {
          return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 400 })
        }

        // userId 생성
        const hash = crypto.createHash("sha256").update(nickname + ":" + password).digest("hex")
        const userId = "user_" + hash.substring(0, 16)

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10)
        const hashedAnswer = await bcrypt.hash(securityAnswer, 10)

        await User.create({ nickname, hashedPassword, userId, securityQuestion, securityAnswer: hashedAnswer })

        return NextResponse.json({ data: { userId, nickname } })
      }

      case "checkNickname": {
        const nickname = String(body.nickname || "").trim()
        const existing = await User.findOne({ nickname })
        return NextResponse.json({ data: { available: !existing } })
      }

      case "forgotPassword.getQuestion": {
        const nickname = String(body.nickname || "").trim()
        const user = await User.findOne({ nickname })
        if (!user) return NextResponse.json({ error: "등록되지 않은 닉네임입니다" }, { status: 404 })
        return NextResponse.json({ data: { question: user.securityQuestion } })
      }

      case "forgotPassword.verify": {
        const nickname = String(body.nickname || "").trim()
        const answer = String(body.answer || "").trim().toLowerCase()
        const newPassword = String(body.newPassword || "")

        const user = await User.findOne({ nickname })
        if (!user) return NextResponse.json({ error: "등록되지 않은 닉네임입니다" }, { status: 404 })

        const match = await bcrypt.compare(answer, user.securityAnswer)
        if (!match) return NextResponse.json({ error: "보안 답변이 일치하지 않습니다" }, { status: 400 })

        // 새 비밀번호 검증
        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
          return NextResponse.json({ error: "새 비밀번호: 8자 이상, 영문+숫자 포함" }, { status: 400 })
        }

        // 비밀번호 + userId 업데이트
        const hash = crypto.createHash("sha256").update(nickname + ":" + newPassword).digest("hex")
        const newUserId = "user_" + hash.substring(0, 16)
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 기존 userId의 모든 데이터를 새 userId로 마이그레이션
        const oldUserId = user.userId
        if (oldUserId !== newUserId) {
          const db = (await import("mongoose")).default.connection.db
          const collections = ["graves", "userdatas", "posts", "comments", "crushes", "analysisrecords", "chathistories", "sajuprofiles", "soulpartners", "counsels", "ssumbungs"]
          for (const col of collections) {
            try {
              await db.collection(col).updateMany({ userId: oldUserId }, { $set: { userId: newUserId } })
            } catch { /* ignore */ }
          }
          // soulpartners는 from/to 양쪽 체크
          try {
            await db.collection("soulpartners").updateMany({ fromUserId: oldUserId }, { $set: { fromUserId: newUserId } })
            await db.collection("soulpartners").updateMany({ toUserId: oldUserId }, { $set: { toUserId: newUserId } })
          } catch { /* ignore */ }
        }

        user.hashedPassword = hashedPassword
        user.userId = newUserId
        await user.save()

        return NextResponse.json({ data: { success: true } })
      }

      case "getQuestions": {
        return NextResponse.json({ data: SECURITY_QUESTIONS })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
