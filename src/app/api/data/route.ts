import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { Grave, UserData, Crush, AnalysisRecord, ChatHistory } from "@/lib/db/models"
import { auth } from "@/lib/auth"

function serialize(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc
  return { id: String(_id), ...rest }
}

export const maxDuration = 30

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { action, ...payload } = body
  if (typeof action !== "string") {
    return NextResponse.json({ error: "action required" }, { status: 400 })
  }

  // 서버측 세션 인증
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()

  try {
    switch (action) {
      // === 묘비 ===
      case "graves.list": {
        const graves = await Grave.find({ userId }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ data: graves.map(serialize) })
      }
      case "graves.get": {
        const grave = await Grave.findOne({ _id: payload.graveId, userId }).lean()
        return NextResponse.json({ data: grave ? serialize(grave as Record<string, unknown>) : null })
      }
      case "graves.save": {
        const { grave } = payload as { grave: Record<string, unknown> }
        if (!grave || typeof grave !== "object") {
          return NextResponse.json({ error: "grave data required" }, { status: 400 })
        }
        const { id: graveId, ...graveRest } = grave
        const graveData = { ...graveRest, userId }

        // 기존 묘비 업데이트
        if (graveId) {
          const existing = await Grave.findOne({ _id: graveId, userId }).catch(() => null)
          if (existing) {
            Object.assign(existing, graveData)
            await existing.save()
            return NextResponse.json({ data: serialize(existing.toObject()) })
          }
        }

        // 새 묘비 (MongoDB가 _id 자동 생성)
        const doc = await Grave.create(graveData)
        return NextResponse.json({ data: serialize(doc.toObject()) })
      }
      case "graves.delete": {
        await Grave.deleteOne({ _id: payload.graveId, userId })
        return NextResponse.json({ data: true })
      }

      // === 유저 데이터 ===
      case "user.get": {
        let user = await UserData.findOne({ userId }).lean()
        if (!user) {
          const created = await UserData.create({ userId })
          user = created.toObject()
        }
        return NextResponse.json({ data: serialize(user as Record<string, unknown>) })
      }
      case "user.addCoins": {
        const amount = Number(payload.amount)
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }
        const user = await UserData.findOneAndUpdate(
          { userId },
          { $inc: { coins: amount } },
          { upsert: true, new: true }
        ).lean()
        return NextResponse.json({ data: serialize(user as Record<string, unknown>) })
      }
      case "user.spendCoins": {
        const amount = Number(payload.amount)
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }
        // 원자적 코인 차감 (레이스 컨디션 방지)
        const result = await UserData.findOneAndUpdate(
          { userId, coins: { $gte: amount } },
          { $inc: { coins: -amount } },
          { new: true }
        ).lean()
        if (!result) {
          return NextResponse.json({ error: "코인 부족", data: null })
        }
        return NextResponse.json({ data: serialize(result as Record<string, unknown>) })
      }
      case "user.addItem": {
        const itemId = String(payload.itemId || "")
        if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })
        const user = await UserData.findOneAndUpdate(
          { userId },
          { $push: { ownedItems: { itemId, purchasedAt: new Date().toISOString() } } },
          { upsert: true, new: true }
        ).lean()
        return NextResponse.json({ data: serialize(user as Record<string, unknown>) })
      }
      case "user.equipItem": {
        await UserData.updateOne(
          { userId, "ownedItems.itemId": payload.itemId },
          { $set: { "ownedItems.$.equippedOn": payload.graveId } }
        )
        return NextResponse.json({ data: true })
      }
      case "user.unequipItem": {
        await UserData.updateOne(
          { userId, "ownedItems.itemId": payload.itemId },
          { $unset: { "ownedItems.$.equippedOn": "" } }
        )
        return NextResponse.json({ data: true })
      }
      case "user.savePositions": {
        await UserData.updateOne(
          { userId },
          { $set: { [`itemPositions.${payload.graveId}`]: payload.positions } },
          { upsert: true }
        )
        return NextResponse.json({ data: true })
      }

      // === 썸 ===
      case "crushes.list": {
        const crushes = await Crush.find({ userId }).sort({ updatedAt: -1 }).lean()
        return NextResponse.json({ data: crushes.map(serialize) })
      }
      case "crushes.save": {
        const { crush } = payload as { crush: Record<string, unknown> }
        if (!crush || typeof crush !== "object") {
          return NextResponse.json({ error: "crush data required" }, { status: 400 })
        }
        const { id: crushId, ...crushRest } = crush

        if (crushId) {
          const existing = await Crush.findOne({ _id: crushId, userId }).catch(() => null)
          if (existing) {
            Object.assign(existing, { ...crushRest, userId })
            await existing.save()
            return NextResponse.json({ data: serialize(existing.toObject()) })
          }
        }
        const doc = await Crush.create({ ...crushRest, userId })
        return NextResponse.json({ data: serialize(doc.toObject()) })
      }
      case "crushes.delete": {
        await Crush.deleteOne({ _id: payload.crushId, userId })
        return NextResponse.json({ data: true })
      }

      // === 분석 기록 ===
      case "analysis.list": {
        const records = await AnalysisRecord.find({ userId }).sort({ createdAt: -1 }).limit(30).lean()
        return NextResponse.json({ data: records.map(serialize) })
      }
      case "analysis.save": {
        const { record } = payload as { record: Record<string, unknown> }
        if (!record) return NextResponse.json({ error: "record required" }, { status: 400 })
        const doc = await AnalysisRecord.create({ ...record, userId })
        return NextResponse.json({ data: serialize(doc.toObject()) })
      }
      case "analysis.delete": {
        await AnalysisRecord.deleteOne({ _id: payload.recordId, userId })
        return NextResponse.json({ data: true })
      }

      // === 채팅 기록 ===
      case "chat.get": {
        const chat = await ChatHistory.findOne({ userId, graveId: payload.graveId }).lean()
        return NextResponse.json({ data: chat ? serialize(chat as Record<string, unknown>) : null })
      }
      case "chat.save": {
        const messages = Array.isArray(payload.messages) ? payload.messages.slice(-200) : []
        await ChatHistory.findOneAndUpdate(
          { userId, graveId: payload.graveId },
          { $set: { messages } },
          { upsert: true }
        )
        return NextResponse.json({ data: true })
      }

      // === 초대 코드 ===
      case "invite.getCode": {
        let user = await UserData.findOne({ userId })
        if (!user) {
          user = await UserData.create({ userId })
        }
        if (!user.inviteCode) {
          // 6자리 코드 생성
          const code = userId.slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
          user.inviteCode = code
          await user.save()
        }
        return NextResponse.json({
          data: {
            inviteCode: user.inviteCode,
            inviteCount: user.inviteCount || 0,
          },
        })
      }

      case "invite.apply": {
        const code = String(payload.code || "").trim().toUpperCase()
        if (!code) return NextResponse.json({ error: "코드를 입력해주세요" }, { status: 400 })

        // 내 계정 확인
        const myUser = await UserData.findOne({ userId })
        if (myUser?.invitedBy) {
          return NextResponse.json({ error: "이미 초대 코드를 사용했습니다" }, { status: 400 })
        }

        // 초대자 찾기
        const inviter = await UserData.findOne({ inviteCode: code })
        if (!inviter) return NextResponse.json({ error: "유효하지 않은 초대 코드입니다" }, { status: 400 })
        if (inviter.userId === userId) return NextResponse.json({ error: "본인 코드는 사용할 수 없습니다" }, { status: 400 })

        // 양쪽 코인 지급
        await UserData.findOneAndUpdate({ userId }, { $set: { invitedBy: code }, $inc: { coins: 200 } }, { upsert: true })
        await UserData.findOneAndUpdate({ inviteCode: code }, { $inc: { coins: 200, inviteCount: 1 } })

        return NextResponse.json({ data: { reward: 200 } })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "DB 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
