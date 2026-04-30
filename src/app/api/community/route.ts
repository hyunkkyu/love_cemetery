import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { Post, Comment, SajuProfile } from "@/lib/db/community-models"
import { UserData } from "@/lib/db/models"
import { auth } from "@/lib/auth"

export const maxDuration = 60

function serialize(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc
  return { id: String(_id), ...rest }
}

function sanitizeText(text: string, maxLen: number): string {
  return text.trim().replace(/<[^>]*>/g, "").slice(0, maxLen)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { action, ...payload } = body

  await connectDB()

  // 읽기 액션은 인증 불필요
  const readActions = ["posts.list", "posts.get", "comments.list"]
  let userId: string | undefined
  let userName: string | undefined

  if (!readActions.includes(action as string)) {
    const session = await auth()
    userId = (session?.user as { id?: string })?.id
    userName = session?.user?.name || "익명"
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
    }
  }

  try {
    switch (action) {
      // === 게시글 ===
      case "posts.list": {
        const category = payload.category as string | undefined
        const sort = (payload.sort as string) || "latest"
        const page = Number(payload.page) || 0
        const limit = 20
        const filter: Record<string, unknown> = {}
        if (category) filter.category = category
        const sortOpt: Record<string, 1 | -1> = sort === "popular" ? { likes: -1, createdAt: -1 } : { createdAt: -1 }
        const posts = await Post.find(filter).sort(sortOpt).skip(page * limit).limit(limit).lean()
        const total = await Post.countDocuments(filter)
        return NextResponse.json({ data: posts.map(serialize), total })
      }

      case "posts.get": {
        const post = await Post.findByIdAndUpdate(
          payload.postId,
          { $inc: { viewCount: 1 } },
          { new: true }
        ).lean()
        return NextResponse.json({ data: post ? serialize(post as Record<string, unknown>) : null })
      }

      case "posts.create": {
        const { title, content, category, tags, attachedSaju, attachedCompatibility } = payload as Record<string, unknown>
        if (!title || !content || !category) {
          return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 })
        }
        const post = await Post.create({
          userId,
          nickname: userName,
          category: sanitizeText(String(category), 10),
          title: sanitizeText(String(title), 50),
          content: sanitizeText(String(content), 5000),
          tags: Array.isArray(tags) ? (tags as string[]).slice(0, 5).map((t) => sanitizeText(String(t), 20)) : [],
          attachedSaju, attachedCompatibility,
        })
        await UserData.findOneAndUpdate({ userId }, { $inc: { coins: 10 } }, { upsert: true })
        return NextResponse.json({ data: serialize(post.toObject()), coinReward: 10 })
      }

      case "posts.delete": {
        await Post.deleteOne({ _id: payload.postId, userId })
        await Comment.deleteMany({ postId: payload.postId })
        return NextResponse.json({ data: true })
      }

      case "posts.like": {
        const existing = await Post.findOne({ _id: payload.postId, likedBy: userId })
        if (existing) {
          await Post.updateOne(
            { _id: payload.postId },
            { $pull: { likedBy: userId }, $inc: { likes: -1 } }
          )
          return NextResponse.json({ data: { liked: false } })
        } else {
          const updated = await Post.findOneAndUpdate(
            { _id: payload.postId },
            { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
            { new: true }
          )
          if (!updated) return NextResponse.json({ error: "게시글 없음" }, { status: 404 })
          if (updated.likes === 10) {
            await UserData.findOneAndUpdate({ userId: updated.userId }, { $inc: { coins: 5 } }, { upsert: true })
          }
          return NextResponse.json({ data: { likes: updated.likes, liked: true } })
        }
      }

      // === 댓글 ===
      case "comments.list": {
        const comments = await Comment.find({ postId: payload.postId }).sort({ createdAt: 1 }).lean()
        return NextResponse.json({ data: comments.map(serialize) })
      }

      case "comments.create": {
        if (!payload.content || !payload.postId) {
          return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 })
        }
        const comment = await Comment.create({
          postId: payload.postId,
          userId,
          nickname: userName,
          content: sanitizeText(String(payload.content), 1000),
        })
        // 코인 보상 +3
        await UserData.findOneAndUpdate({ userId }, { $inc: { coins: 3 } }, { upsert: true })
        return NextResponse.json({ data: serialize(comment.toObject()), coinReward: 3 })
      }

      case "comments.delete": {
        await Comment.deleteOne({ _id: payload.commentId, userId })
        return NextResponse.json({ data: true })
      }

      case "comments.like": {
        const existingComment = await Comment.findOne({ _id: payload.commentId, likedBy: userId })
        if (existingComment) {
          await Comment.updateOne(
            { _id: payload.commentId },
            { $pull: { likedBy: userId }, $inc: { likes: -1 } }
          )
          return NextResponse.json({ data: { liked: false } })
        } else {
          const updatedComment = await Comment.findOneAndUpdate(
            { _id: payload.commentId },
            { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
            { new: true }
          )
          if (!updatedComment) return NextResponse.json({ error: "댓글 없음" }, { status: 404 })
          return NextResponse.json({ data: { likes: updatedComment.likes, liked: true } })
        }
      }

      // === 사주 프로필 (매칭) ===
      case "saju.register": {
        const profile = await SajuProfile.findOneAndUpdate(
          { userId },
          { $set: { ...(payload.profile as Record<string, unknown>), userId, nickname: userName } },
          { upsert: true, new: true }
        ).lean()
        return NextResponse.json({ data: serialize(profile as Record<string, unknown>) })
      }

      case "saju.getProfile": {
        const profile = await SajuProfile.findOne({ userId }).lean()
        return NextResponse.json({ data: profile ? serialize(profile as Record<string, unknown>) : null })
      }

      case "saju.findMatches": {
        // 코인 30 원자적 차감
        const user = await UserData.findOneAndUpdate(
          { userId, coins: { $gte: 30 } },
          { $inc: { coins: -30 } },
          { new: true }
        )
        if (!user) {
          return NextResponse.json({ error: "코인이 부족합니다 (30코인 필요)" }, { status: 400 })
        }

        const myProfile = await SajuProfile.findOne({ userId }).lean()
        if (!myProfile) {
          return NextResponse.json({ error: "먼저 사주 프로필을 등록해주세요" }, { status: 400 })
        }

        const candidates = await SajuProfile.find({
          userId: { $ne: userId },
          isPublic: true,
        }).lean()

        // 오행 상성 점수 계산
        const generating: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" }
        const overcoming: Record<string, string> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" }

        const myElement = myProfile.dominantElement as string
        const scored = candidates.map((c) => {
          const cElement = c.dominantElement as string
          let score = 50
          if (generating[myElement] === cElement || generating[cElement] === myElement) score += 30
          if (myElement === cElement) score += 20
          if (overcoming[myElement] === cElement || overcoming[cElement] === myElement) score -= 10

          // elementBalance 유사도 보정
          if (myProfile.elementBalance && c.elementBalance) {
            const myBal = myProfile.elementBalance as Record<string, number>
            const cBal = c.elementBalance as Record<string, number>
            let complement = 0
            for (const el of ["목", "화", "토", "금", "수"]) {
              if ((myBal[el] || 0) === 0 && (cBal[el] || 0) > 0) complement += 5
              if ((cBal[el] || 0) === 0 && (myBal[el] || 0) > 0) complement += 5
            }
            score += complement
          }

          return { ...serialize(c as Record<string, unknown>), matchScore: Math.min(100, Math.max(0, score)) }
        })

        scored.sort((a, b) => b.matchScore - a.matchScore)

        return NextResponse.json({
          data: scored.slice(0, 5),
          coinsSpent: 30,
          remainingCoins: user.coins,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
