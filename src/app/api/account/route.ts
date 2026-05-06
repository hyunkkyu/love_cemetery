import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { User } from "@/lib/db/models"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export const maxDuration = 30

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  await connectDB()
  const { action } = body

  try {
    switch (action) {
      case "register": {
        const nickname = String(body.nickname || "").trim()
        const email = String(body.email || "").trim().toLowerCase()
        const password = String(body.password || "")

        // 닉네임 검증
        if (nickname.length < 2 || nickname.length > 12) {
          return NextResponse.json({ error: "닉네임은 2~12자여야 합니다" }, { status: 400 })
        }
        if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
          return NextResponse.json({ error: "닉네임은 한글/영문/숫자만 가능합니다" }, { status: 400 })
        }

        // 이메일 검증
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: "올바른 이메일을 입력해주세요" }, { status: 400 })
        }

        // 비밀번호 검증
        if (password.length < 8) {
          return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다" }, { status: 400 })
        }
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
          return NextResponse.json({ error: "비밀번호에 영문과 숫자를 모두 포함해주세요" }, { status: 400 })
        }

        // 중복 체크
        const existingNick = await User.findOne({ nickname })
        if (existingNick) {
          return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 400 })
        }
        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
          return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 400 })
        }

        // userId 생성
        const hash = crypto.createHash("sha256").update(nickname + ":" + password).digest("hex")
        const userId = "user_" + hash.substring(0, 16)

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({ nickname, email, hashedPassword, userId })

        return NextResponse.json({ data: { userId, nickname } })
      }

      case "checkNickname": {
        const nickname = String(body.nickname || "").trim()
        const existing = await User.findOne({ nickname })
        return NextResponse.json({ data: { available: !existing } })
      }

      // 비밀번호 재설정 이메일 발송
      case "forgotPassword.sendEmail": {
        const email = String(body.email || "").trim().toLowerCase()
        if (!email) return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 })

        const user = await User.findOne({ email })
        if (!user) {
          // 보안: 등록 여부를 노출하지 않음
          return NextResponse.json({ data: { sent: true } })
        }

        // 리셋 토큰 생성 (1시간 유효)
        const resetToken = crypto.randomBytes(32).toString("hex")
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

        user.resetToken = resetToken
        user.resetTokenExpiry = resetTokenExpiry
        await user.save()

        // 이메일 발송
        const appUrl = process.env.APP_URL || "https://love-cemetery.vercel.app"
        const resetLink = appUrl + "/reset-password?token=" + resetToken

        try {
          const { sendResetEmail } = await import("@/lib/mailer")
          await sendResetEmail(email, user.nickname, resetLink)
        } catch (emailErr) {
          console.error("Email send error:", emailErr)
          return NextResponse.json({ error: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 })
        }

        return NextResponse.json({ data: { sent: true } })
      }

      // 토큰 검증
      case "forgotPassword.verifyToken": {
        const token = String(body.token || "")
        const user = await User.findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: new Date() },
        })
        if (!user) {
          return NextResponse.json({ error: "유효하지 않거나 만료된 링크입니다" }, { status: 400 })
        }
        return NextResponse.json({ data: { nickname: user.nickname } })
      }

      // 비밀번호 재설정
      case "forgotPassword.reset": {
        const token = String(body.token || "")
        const newPassword = String(body.newPassword || "")

        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
          return NextResponse.json({ error: "비밀번호: 8자 이상, 영문+숫자 포함" }, { status: 400 })
        }

        const user = await User.findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: new Date() },
        })
        if (!user) {
          return NextResponse.json({ error: "유효하지 않거나 만료된 링크입니다" }, { status: 400 })
        }

        // 새 비밀번호 + userId 업데이트
        const hash = crypto.createHash("sha256").update(user.nickname + ":" + newPassword).digest("hex")
        const newUserId = "user_" + hash.substring(0, 16)
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 기존 데이터 마이그레이션
        const oldUserId = user.userId
        if (oldUserId !== newUserId) {
          const mongoose = (await import("mongoose")).default
          const db = mongoose.connection.db!
          const cols = ["graves", "userdatas", "posts", "comments", "crushes", "analysisrecords", "chathistories", "sajuprofiles", "counsels", "ssumbungs"]
          for (const col of cols) {
            try { await db.collection(col).updateMany({ userId: oldUserId }, { $set: { userId: newUserId } }) } catch {}
          }
          try {
            await db.collection("soulpartners").updateMany({ fromUserId: oldUserId }, { $set: { fromUserId: newUserId } })
            await db.collection("soulpartners").updateMany({ toUserId: oldUserId }, { $set: { toUserId: newUserId } })
          } catch {}
        }

        user.hashedPassword = hashedPassword
        user.userId = newUserId
        user.resetToken = undefined
        user.resetTokenExpiry = undefined
        await user.save()

        return NextResponse.json({ data: { success: true } })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임 또는 이메일입니다" }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
