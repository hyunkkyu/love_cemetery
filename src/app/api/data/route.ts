import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { Grave, UserData, Crush, AnalysisRecord, ChatHistory, ManseryeokChat, CoinLog } from "@/lib/db/models"

async function logCoin(userId: string, amount: number, reason: string) {
  try {
    const user = await UserData.findOne({ userId })
    await CoinLog.create({ userId, amount, reason, balance: user?.coins || 0 })
  } catch { /* ignore */ }
}
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

        // 기존 묘비 업데이트 (코인 보상 없음)
        if (graveId) {
          const existing = await Grave.findOne({ _id: graveId, userId }).catch(() => null)
          if (existing) {
            const { _id, userId: _, createdAt, ...allowed } = graveData as Record<string, unknown>
            await Grave.findOneAndUpdate({ _id: graveId, userId }, { $set: allowed })
            const updated = await Grave.findOne({ _id: graveId, userId }).lean()
            return NextResponse.json({ data: updated ? serialize(updated as Record<string, unknown>) : null })
          }
        }

        // 새 묘비 + 서버에서 코인 보상
        const doc = await Grave.create(graveData)
        const gradeCoins: Record<string, number> = { national: 400, public: 300, sea: 100 }
        const reward = gradeCoins[String(grave.grade)] || 300
        await UserData.findOneAndUpdate({ userId }, { $inc: { coins: reward } }, { upsert: true })
        await logCoin(userId, reward, "묘비 등록 (" + (grave.nickname || "?") + ")")
        return NextResponse.json({ data: serialize(doc.toObject()), coinReward: reward })
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
        // 클라이언트 직접 호출 차단 - 서버 내부에서만 코인 지급
        return NextResponse.json({ error: "이 작업은 허용되지 않습니다" }, { status: 403 })
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
        await logCoin(userId, -amount, String(payload.reason || "코인 사용"))
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
        const safeGraveId = String(payload.graveId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50)
        if (!safeGraveId) return NextResponse.json({ error: "Invalid graveId" }, { status: 400 })
        await UserData.updateOne(
          { userId },
          { $set: { [`itemPositions.${safeGraveId}`]: payload.positions } },
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

      // === 만세력 채팅 보관 ===
      // === 마이페이지 ===
      case "mypage.coinLog": {
        const logs = await CoinLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean()
        return NextResponse.json({ data: logs.map(serialize) })
      }

      case "mypage.stats": {
        const [graveCount, postCount, commentCount, ssumCount] = await Promise.all([
          Grave.countDocuments({ userId }),
          (await import("@/lib/db/community-models")).Post.countDocuments({ userId }),
          (await import("@/lib/db/community-models")).Comment.countDocuments({ userId }),
          (await import("mongoose")).default.connection.db!.collection("ssumbungs").countDocuments({ userId }),
        ])
        // 내 묘비 랭킹
        const allUsers = await Grave.aggregate([
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        const myRank = allUsers.findIndex((u) => u._id === userId) + 1

        const user = await UserData.findOne({ userId }).lean()
        return NextResponse.json({
          data: {
            coins: (user as Record<string, unknown>)?.coins || 0,
            inviteCount: (user as Record<string, unknown>)?.inviteCount || 0,
            graveCount, postCount, commentCount, ssumCount,
            graveRank: myRank || "순위 없음",
            totalUsers: allUsers.length,
          },
        })
      }

      case "msChat.save": {
        const { chatId, birthDate: bd, name: nm, analysis: an, messages: msgs } = payload as Record<string, unknown>
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
        if (chatId) {
          await ManseryeokChat.findOneAndUpdate(
            { _id: chatId, userId },
            { $set: { messages: msgs } }
          )
          return NextResponse.json({ data: { id: chatId } })
        }
        const doc = await ManseryeokChat.create({
          userId, birthDate: bd, name: nm,
          analysis: String(an || "").slice(0, 500),
          messages: msgs || [],
          expiresAt,
        })
        return NextResponse.json({ data: serialize(doc.toObject()) })
      }

      case "msChat.list": {
        const chats = await ManseryeokChat.find({
          userId,
          $or: [
            { isPermanent: true },
            { expiresAt: { $gt: new Date() } },
          ],
        }).sort({ createdAt: -1 }).limit(20).lean()

        const now = Date.now()
        const result = chats.map((c) => {
          const doc = c as Record<string, unknown>
          const expires = doc.expiresAt ? new Date(doc.expiresAt as string).getTime() : 0
          const daysLeft = Math.max(0, Math.ceil((expires - now) / (24 * 60 * 60 * 1000)))
          return {
            ...serialize(doc),
            daysLeft: doc.isPermanent ? -1 : daysLeft, // -1 = 영구
            isExpiring: !doc.isPermanent && daysLeft <= 2,
          }
        })
        return NextResponse.json({ data: result })
      }

      case "msChat.get": {
        const doc = await ManseryeokChat.findOne({ _id: payload.chatId, userId }).lean()
        if (!doc) return NextResponse.json({ data: null })
        const d = doc as Record<string, unknown>
        const expires = d.expiresAt ? new Date(d.expiresAt as string).getTime() : 0
        const daysLeft = d.isPermanent ? -1 : Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)))

        // 만료 확인
        if (!d.isPermanent && daysLeft <= 0) {
          return NextResponse.json({ data: null, expired: true })
        }
        return NextResponse.json({ data: { ...serialize(d), daysLeft } })
      }

      case "msChat.extend": {
        // 10코인으로 영구 보관
        const spendResult = await UserData.findOneAndUpdate(
          { userId, coins: { $gte: 10 } },
          { $inc: { coins: -10 } },
          { returnDocument: "after" }
        )
        if (!spendResult) return NextResponse.json({ error: "코인이 부족합니다 (10코인 필요)" }, { status: 400 })

        await ManseryeokChat.findOneAndUpdate(
          { _id: payload.chatId, userId },
          { $set: { isPermanent: true }, $unset: { expiresAt: "" } }
        )
        return NextResponse.json({ data: { success: true, coins: spendResult.coins } })
      }

      case "msChat.delete": {
        await ManseryeokChat.deleteOne({ _id: payload.chatId, userId })
        return NextResponse.json({ data: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "DB 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
