import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { User, EmailVerification } from "@/lib/db/models"
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
      // 이메일 인증 코드 발송
      case "sendVerifyCode": {
        const email = String(body.email || "").trim().toLowerCase()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: "올바른 이메일을 입력해주세요" }, { status: 400 })
        }

        // 이미 등록된 이메일 체크
        const exists = await User.findOne({ email })
        if (exists) {
          return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 400 })
        }

        // 60초 내 재발송 방지
        const prev = await EmailVerification.findOne({ email }).lean()
        if (prev) {
          const elapsed = Date.now() - new Date((prev as Record<string, unknown>).createdAt as string).getTime()
          if (elapsed < 60 * 1000) {
            return NextResponse.json({ error: "잠시 후 다시 시도해주세요 (60초 제한)" }, { status: 429 })
          }
        }

        // 6자리 코드 생성 → MongoDB 저장 (5분 TTL)
        const code = String(Math.floor(100000 + Math.random() * 900000))
        await EmailVerification.findOneAndUpdate(
          { email },
          { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        try {
          const { sendVerifyCode } = await import("@/lib/mailer")
          await sendVerifyCode(email, code)
        } catch {
          await EmailVerification.deleteOne({ email })
          return NextResponse.json({ error: "이메일 발송에 실패했습니다" }, { status: 500 })
        }

        return NextResponse.json({ data: { sent: true } })
      }

      case "register": {
        const nickname = String(body.nickname || "").trim()
        const email = String(body.email || "").trim().toLowerCase()
        const password = String(body.password || "")
        const verifyCode = String(body.verifyCode || "").trim()

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

        // 이메일 인증 코드 검증 (MongoDB 조회)
        const stored = await EmailVerification.findOne({ email }).lean() as Record<string, unknown> | null
        if (!stored || stored.code !== verifyCode) {
          return NextResponse.json({ error: "인증 코드가 올바르지 않습니다" }, { status: 400 })
        }
        if (new Date(stored.expiresAt as string).getTime() < Date.now()) {
          await EmailVerification.deleteOne({ email })
          return NextResponse.json({ error: "인증 코드가 만료되었습니다. 다시 발송해주세요" }, { status: 400 })
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
        await EmailVerification.deleteOne({ email }) // 사용된 코드 제거

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

        // 리셋 토큰 생성 (1시간 유효) - 해시화하여 DB 저장
        const resetToken = crypto.randomBytes(32).toString("hex")
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

        user.resetToken = hashedToken // 해시된 값만 DB에 저장
        user.resetTokenExpiry = resetTokenExpiry
        await user.save()

        // 이메일에는 원본 토큰 발송
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
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
        const user = await User.findOne({
          resetToken: hashedToken,
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

        const hashedResetToken = crypto.createHash("sha256").update(token).digest("hex")
        const user = await User.findOne({
          resetToken: hashedResetToken,
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
          const cols = ["graves", "userdatas", "posts", "comments", "crushes", "analysisrecords", "chathistories", "sajuprofiles", "counsels", "ssumbungs", "manseryeokchats", "coinlogs", "ailogs", "gravecomments"]
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

      // 계정 및 모든 데이터 삭제
      case "deleteAccount": {
        const session = await (await import("@/lib/auth")).auth()
        const sessionUserId = (session?.user as { id?: string })?.id
        if (!sessionUserId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })

        const confirmText = String(body.confirmText || "")
        if (confirmText !== "계정삭제") {
          return NextResponse.json({ error: "'계정삭제'를 정확히 입력해주세요" }, { status: 400 })
        }

        const mongoose = (await import("mongoose")).default
        const db = mongoose.connection.db!

        // 모든 컬렉션에서 해당 유저 데이터 삭제
        const collections = [
          "graves", "userdatas", "posts", "comments", "crushes",
          "analysisrecords", "chathistories", "sajuprofiles",
          "counsels", "ssumbungs", "manseryeokchats", "coinlogs", "ailogs",
        ]
        for (const col of collections) {
          try { await db.collection(col).deleteMany({ userId: sessionUserId }) } catch { /* ignore */ }
        }
        // 동반자 관계 삭제
        try {
          await db.collection("soulpartners").deleteMany({
            $or: [{ fromUserId: sessionUserId }, { toUserId: sessionUserId }],
          })
        } catch { /* ignore */ }
        // 묘비 코멘트 삭제
        try {
          await db.collection("gravecomments").deleteMany({ userId: sessionUserId })
        } catch { /* ignore */ }

        // 유저 계정 삭제
        await User.deleteOne({ userId: sessionUserId })

        return NextResponse.json({ data: { deleted: true } })
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
