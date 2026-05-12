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
  const readActions = ["posts.list", "posts.get", "comments.list", "saju.stats"]
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

      // === 통계 ===
      case "saju.stats": {
        const profiles = await SajuProfile.find({ isPublic: true }).lean()
        const total = profiles.length
        const genderDist = { M: 0, F: 0, unknown: 0 }
        const elementDist: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
        const yearBranchDist: Record<string, number> = {}
        const iljuDist: Record<string, number> = {}
        const mbtiDist: Record<string, number> = {}

        for (const p of profiles) {
          const doc = p as Record<string, unknown>
          if (doc.gender === "M") genderDist.M++
          else if (doc.gender === "F") genderDist.F++
          else genderDist.unknown++

          if (doc.dominantElement && elementDist[doc.dominantElement as string] !== undefined) {
            elementDist[doc.dominantElement as string]++
          }
          if (doc.yearBranch) yearBranchDist[doc.yearBranch as string] = (yearBranchDist[doc.yearBranch as string] || 0) + 1
          if (doc.ilju) iljuDist[doc.ilju as string] = (iljuDist[doc.ilju as string] || 0) + 1
          if (doc.mbti) mbtiDist[doc.mbti as string] = (mbtiDist[doc.mbti as string] || 0) + 1
        }

        // 최근 업데이트 시간
        const latest = await SajuProfile.findOne({ isPublic: true }).sort({ updatedAt: -1 }).lean()
        const lastUpdatedAt = latest ? (latest as Record<string, unknown>).updatedAt : null

        return NextResponse.json({
          data: {
            total, genderDist, elementDist,
            yearBranchDist, iljuDist, mbtiDist,
            lastUpdatedAt,
          },
        })
      }

      case "saju.premiumStat": {
        // 10코인 차감
        const spender = await UserData.findOneAndUpdate(
          { userId, coins: { $gte: 10 } },
          { $inc: { coins: -10 } },
          { new: true }
        )
        if (!spender) return NextResponse.json({ error: "코인이 부족합니다 (10코인 필요)" }, { status: 400 })

        const statType = payload.statType as string
        const allProfiles = await SajuProfile.find({ isPublic: true }).lean()

        const ZODIAC: Record<string, string> = {
          자: "🐭 쥐", 축: "🐮 소", 인: "🐯 호랑이", 묘: "🐰 토끼",
          진: "🐲 용", 사: "🐍 뱀", 오: "🐴 말", 미: "🐑 양",
          신: "🐵 원숭이", 유: "🐔 닭", 술: "🐶 개", 해: "🐷 돼지",
        }
        const ELEMENT_TRAITS: Record<string, string> = {
          목: "성장지향, 창의적, 인자함, 리더십",
          화: "열정적, 예의 바름, 활력 넘침, 표현력",
          토: "안정적, 신뢰감, 중재 능력, 책임감",
          금: "결단력, 의리, 강인함, 완벽주의",
          수: "지혜로움, 유연함, 소통 능력, 적응력",
        }

        let result: unknown = null

        switch (statType) {
          case "elementTraits": {
            const dist: Array<{ element: string; count: number; traits: string; ratio: string }> = []
            for (const el of ["목", "화", "토", "금", "수"]) {
              const count = allProfiles.filter((p) => (p as Record<string, unknown>).dominantElement === el).length
              dist.push({
                element: el,
                count,
                traits: ELEMENT_TRAITS[el] || "",
                ratio: allProfiles.length > 0 ? (count / allProfiles.length * 100).toFixed(1) + "%" : "0%",
              })
            }
            result = dist
            break
          }
          case "yearBranch": {
            const dist: Array<{ branch: string; zodiac: string; count: number }> = []
            const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
            for (const b of branches) {
              const count = allProfiles.filter((p) => (p as Record<string, unknown>).yearBranch === b).length
              if (count > 0) dist.push({ branch: b, zodiac: ZODIAC[b] || b, count })
            }
            dist.sort((a, b) => b.count - a.count)
            result = dist
            break
          }
          case "iljuDist": {
            const map: Record<string, number> = {}
            for (const p of allProfiles) {
              const ilju = (p as Record<string, unknown>).ilju as string
              if (ilju) map[ilju] = (map[ilju] || 0) + 1
            }
            result = Object.entries(map)
              .map(([ilju, count]) => ({ ilju, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 20)
            break
          }
          case "elementCompat": {
            // 오행 조합별 궁합 통계
            const generating: [string, string][] = [["목", "화"], ["화", "토"], ["토", "금"], ["금", "수"], ["수", "목"]]
            const combos = generating.map(([a, b]) => ({
              pair: `${a} → ${b}`,
              type: "상생",
              desc: `${a} 기운이 ${b}를 살려주는 관계`,
              count: allProfiles.filter((p) => (p as Record<string, unknown>).dominantElement === a).length
                + allProfiles.filter((p) => (p as Record<string, unknown>).dominantElement === b).length,
            }))
            result = combos
            break
          }
          default:
            return NextResponse.json({ error: "알 수 없는 통계 유형" }, { status: 400 })
        }

        return NextResponse.json({ data: result, coins: spender.coins })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = "서버 오류가 발생했습니다"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
