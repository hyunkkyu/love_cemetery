import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { SoulPartner, Grave, GraveComment, UserData } from "@/lib/db/models"
import { SajuProfile } from "@/lib/db/community-models"
import { auth } from "@/lib/auth"

function serialize(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc
  return { id: String(_id), ...rest }
}

export const maxDuration = 30

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const session = await auth()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || "익명"

  const { action } = body
  const readActions = ["partner.search"]
  if (!userId && !readActions.includes(action as string)) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  await connectDB()

  try {
    switch (action) {
      // 전체 유저 목록 (자기 자신 + 이미 동반자인 사람 제외)
      case "partner.userList": {
        // 이미 동반자이거나 신청 중인 유저 ID 수집
        const existingRelations = await SoulPartner.find({
          $or: [{ fromUserId: userId }, { toUserId: userId }],
          status: { $in: ["pending", "accepted"] },
        }).lean()
        const excludeIds = new Set([userId])
        for (const r of existingRelations) {
          const doc = r as Record<string, unknown>
          excludeIds.add(String(doc.fromUserId || ""))
          excludeIds.add(String(doc.toUserId || ""))
        }

        const profiles = await SajuProfile.find(
          { isPublic: true },
          { userId: 1, nickname: 1, dominantElement: 1, mbti: 1 }
        ).sort({ updatedAt: -1 }).limit(50).lean()

        const filtered = profiles.filter(p => !excludeIds.has(p.userId))
        return NextResponse.json({ data: filtered.map(serialize) })
      }

      // 동반자 신청
      case "partner.request": {
        const toUserId = String(body.toUserId || "")
        const toNickname = String(body.toNickname || "")
        if (!toUserId || toUserId === userId) {
          return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 })
        }
        // 이미 존재하는지 확인
        const existing = await SoulPartner.findOne({
          $or: [
            { fromUserId: userId, toUserId },
            { fromUserId: toUserId, toUserId: userId },
          ]
        })
        if (existing) {
          return NextResponse.json({ error: "이미 신청했거나 연결된 동반자입니다" }, { status: 400 })
        }
        const partner = await SoulPartner.create({
          fromUserId: userId, fromNickname: userName,
          toUserId, toNickname,
        })
        return NextResponse.json({ data: serialize(partner.toObject()) })
      }

      // 받은 신청 목록
      case "partner.received": {
        const received = await SoulPartner.find({ toUserId: userId, status: "pending" }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ data: received.map(serialize) })
      }

      // 신청 수락
      case "partner.accept": {
        const result = await SoulPartner.findOneAndUpdate(
          { _id: body.requestId, toUserId: userId, status: "pending" },
          { $set: { status: "accepted" } },
          { returnDocument: "after" }
        ).lean()
        if (!result) return NextResponse.json({ error: "신청을 찾을 수 없습니다" }, { status: 404 })
        return NextResponse.json({ data: serialize(result as Record<string, unknown>) })
      }

      // 신청 거절
      case "partner.reject": {
        await SoulPartner.findOneAndUpdate(
          { _id: body.requestId, toUserId: userId, status: "pending" },
          { $set: { status: "rejected" } }
        )
        return NextResponse.json({ data: true })
      }

      // 내 동반자 목록
      case "partner.list": {
        const partners = await SoulPartner.find({
          $or: [{ fromUserId: userId }, { toUserId: userId }],
          status: "accepted",
        }).lean()
        const result = partners.map(p => {
          const doc = p as Record<string, unknown>
          const s = serialize(doc)
          const fromId = String(doc.fromUserId || "")
          const toId = String(doc.toUserId || "")
          const isFrom = fromId === userId
          return {
            ...s,
            partnerId: isFrom ? toId : fromId,
            partnerNickname: isFrom ? String(doc.toNickname || "") : String(doc.fromNickname || ""),
          }
        })
        return NextResponse.json({ data: result })
      }

      // 동반자 삭제 (연결 해제)
      case "partner.remove": {
        await SoulPartner.deleteOne({
          _id: body.partnerId,
          $or: [{ fromUserId: userId }, { toUserId: userId }],
        })
        return NextResponse.json({ data: true })
      }

      // 동반자의 묘비 목록
      case "partner.graves": {
        const partnerId = String(body.partnerId || "")
        // 동반자 관계 확인
        const relation = await SoulPartner.findOne({
          $or: [
            { fromUserId: userId, toUserId: partnerId },
            { fromUserId: partnerId, toUserId: userId },
          ],
          status: "accepted",
        })
        if (!relation) return NextResponse.json({ error: "동반자 관계가 아닙니다" }, { status: 403 })
        const graves = await Grave.find({ userId: partnerId }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ data: graves.map(serialize) })
      }

      // 동반자의 묘비 상세
      case "partner.graveDetail": {
        const partnerId = String(body.partnerId || "")
        const graveId = String(body.graveId || "")
        const relation = await SoulPartner.findOne({
          $or: [
            { fromUserId: userId, toUserId: partnerId },
            { fromUserId: partnerId, toUserId: userId },
          ],
          status: "accepted",
        })
        if (!relation) return NextResponse.json({ error: "동반자 관계가 아닙니다" }, { status: 403 })
        const grave = await Grave.findOne({ _id: graveId, userId: partnerId }).lean()
        return NextResponse.json({ data: grave ? serialize(grave as Record<string, unknown>) : null })
      }

      // 묘비 코멘트 목록
      case "comment.list": {
        const graveId = String(body.graveId || "")
        const comments = await GraveComment.find({ graveId }).sort({ createdAt: -1 }).lean()
        return NextResponse.json({ data: comments.map(serialize) })
      }

      // 묘비 코멘트 작성
      case "comment.create": {
        const graveId = String(body.graveId || "")
        const graveOwnerId = String(body.graveOwnerId || "")
        const content = String(body.content || "").trim().replace(/<[^>]*>/g, "").slice(0, 500)
        if (!content) return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 })

        // 동반자 관계이거나 본인 묘비인지 확인
        if (graveOwnerId !== userId) {
          const relation = await SoulPartner.findOne({
            $or: [
              { fromUserId: userId, toUserId: graveOwnerId },
              { fromUserId: graveOwnerId, toUserId: userId },
            ],
            status: "accepted",
          })
          if (!relation) return NextResponse.json({ error: "동반자만 코멘트를 남길 수 있습니다" }, { status: 403 })
        }

        const comment = await GraveComment.create({ graveId, graveOwnerId, userId, nickname: userName, content })
        // 코멘트 작성 보상 +5코인
        await UserData.findOneAndUpdate({ userId }, { $inc: { coins: 5 } }, { upsert: true })
        return NextResponse.json({ data: serialize(comment.toObject()), coinReward: 5 })
      }

      // 묘비 코멘트 삭제
      case "comment.delete": {
        await GraveComment.deleteOne({ _id: body.commentId, userId })
        return NextResponse.json({ data: true })
      }

      // 향피우기 (묘비에 위로/공감)
      case "incense.burn": {
        const graveId = String(body.graveId || "")
        const graveOwnerId = String(body.graveOwnerId || "")
        const incenseType = String(body.incenseType || "comfort") // comfort, cheer, pray, love

        // 동반자 관계이거나 본인 묘비
        if (graveOwnerId !== userId) {
          const relation = await SoulPartner.findOne({
            $or: [
              { fromUserId: userId, toUserId: graveOwnerId },
              { fromUserId: graveOwnerId, toUserId: userId },
            ],
            status: "accepted",
          })
          if (!relation) return NextResponse.json({ error: "동반자만 향을 피울 수 있습니다" }, { status: 403 })
        }

        const INCENSE_TYPES: Record<string, string> = {
          comfort: "🪔 위로의 향",
          cheer: "🔥 응원의 향",
          pray: "🕯️ 기도의 향",
          love: "💜 사랑의 향",
        }

        await GraveComment.create({
          graveId, graveOwnerId, userId,
          nickname: userName,
          content: (INCENSE_TYPES[incenseType] || "🪔 향") + "을 피웠습니다",
        })

        return NextResponse.json({ data: { type: incenseType, message: INCENSE_TYPES[incenseType] || "🪔 향" } })
      }

      // 받은 신청 수
      case "partner.pendingCount": {
        const count = await SoulPartner.countDocuments({ toUserId: userId, status: "pending" })
        return NextResponse.json({ data: count })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
