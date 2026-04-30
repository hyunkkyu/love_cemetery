import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db/mongoose"
import { Grave } from "@/lib/db/models"
import { SajuProfile } from "@/lib/db/community-models"
import { auth } from "@/lib/auth"

// 5분 캐시
const CACHE_TTL = 5 * 60 * 1000
const cache: Record<string, { data: unknown; ts: number }> = {}

function getCached(key: string) {
  const c = cache[key]
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data
  return null
}
function setCache(key: string, data: unknown) {
  cache[key] = { data, ts: Date.now() }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const { action } = body
  await connectDB()

  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  try {
    switch (action) {
      case "overview": {
        const cached = getCached("overview")
        if (cached) return NextResponse.json({ data: cached })

        const [totalUsers, totalGraves, totalProfiles] = await Promise.all([
          Grave.distinct("userId").then(r => r.length),
          Grave.countDocuments(),
          SajuProfile.countDocuments({ isPublic: true }),
        ])

        const topCauses = await Grave.aggregate([
          { $match: { causeOfDeath: { $exists: true, $ne: "" } } },
          { $group: { _id: "$causeOfDeath", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])

        const elementDist = await SajuProfile.aggregate([
          { $match: { dominantElement: { $exists: true }, isPublic: true } },
          { $group: { _id: "$dominantElement", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])

        const mbtiDist = await SajuProfile.aggregate([
          { $match: { mbti: { $exists: true, $ne: null }, isPublic: true } },
          { $group: { _id: "$mbti", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])

        const data = { totalUsers, totalGraves, totalProfiles, topCauses, elementDist, mbtiDist }
        setCache("overview", data)
        return NextResponse.json({ data })
      }

      case "ranking": {
        const cached = getCached("ranking")
        if (cached) return NextResponse.json({ data: cached })

        const ranking = await Grave.aggregate([
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 50 },
        ])

        // 닉네임 조인
        const userIds = ranking.map(r => r._id)
        const profiles = await SajuProfile.find({ userId: { $in: userIds } }, { userId: 1, nickname: 1 }).lean()
        const nicknameMap: Record<string, string> = {}
        for (const p of profiles) nicknameMap[p.userId] = p.nickname

        const data = ranking.map((r, i) => ({
          rank: i + 1,
          userId: r._id,
          nickname: nicknameMap[r._id] || "익명 유저",
          graveCount: r.count,
        }))

        setCache("ranking", data)
        return NextResponse.json({ data })
      }

      case "myPosition": {
        if (!userId) return NextResponse.json({ data: null })
        const myCount = await Grave.countDocuments({ userId })
        const above = await Grave.aggregate([
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $match: { count: { $gt: myCount } } },
        ])
        return NextResponse.json({ data: { rank: above.length + 1, graveCount: myCount } })
      }

      case "mbtiStats": {
        const cached = getCached("mbtiStats")
        if (cached) return NextResponse.json({ data: cached })

        const mbtiProfiles = await SajuProfile.find({ mbti: { $exists: true, $ne: null }, isPublic: true }, { userId: 1, mbti: 1 }).lean()
        const mbtiGroups: Record<string, string[]> = {}
        for (const p of mbtiProfiles) {
          if (!mbtiGroups[p.mbti]) mbtiGroups[p.mbti] = []
          mbtiGroups[p.mbti].push(p.userId)
        }

        const result: Record<string, unknown>[] = []
        for (const [mbti, userIds] of Object.entries(mbtiGroups)) {
          const graves = await Grave.find({ userId: { $in: userIds } }).lean()
          const causes: Record<string, number> = {}
          let totalDuration = 0
          let durationCount = 0
          const grades: Record<string, number> = { national: 0, public: 0, sea: 0 }

          for (const g of graves) {
            if (g.causeOfDeath) causes[g.causeOfDeath] = (causes[g.causeOfDeath] || 0) + 1
            if (g.grade) grades[g.grade] = (grades[g.grade] || 0) + 1
            if (g.relationshipStart && g.relationshipEnd) {
              const months = Math.round((new Date(g.relationshipEnd).getTime() - new Date(g.relationshipStart).getTime()) / (30 * 24 * 60 * 60 * 1000))
              if (months > 0 && months < 600) { totalDuration += months; durationCount++ }
            }
          }

          const topCause = Object.entries(causes).sort((a, b) => b[1] - a[1])[0]
          result.push({
            mbti,
            userCount: userIds.length,
            graveCount: graves.length,
            avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
            topCause: topCause ? topCause[0] : null,
            grades,
          })
        }
        result.sort((a, b) => (b.userCount as number) - (a.userCount as number))
        setCache("mbtiStats", result)
        return NextResponse.json({ data: result })
      }

      case "iljuStats": {
        const cached = getCached("iljuStats")
        if (cached) return NextResponse.json({ data: cached })

        const iljuProfiles = await SajuProfile.find({ ilju: { $exists: true, $ne: null }, isPublic: true }, { userId: 1, ilju: 1, dominantElement: 1 }).lean()
        const iljuGroups: Record<string, { userIds: string[]; element: string }> = {}
        for (const p of iljuProfiles) {
          if (!iljuGroups[p.ilju]) iljuGroups[p.ilju] = { userIds: [], element: p.dominantElement }
          iljuGroups[p.ilju].userIds.push(p.userId)
        }

        const result: Record<string, unknown>[] = []
        for (const [ilju, { userIds, element }] of Object.entries(iljuGroups)) {
          const graveCount = await Grave.countDocuments({ userId: { $in: userIds } })
          result.push({ ilju, element, userCount: userIds.length, graveCount })
        }
        result.sort((a, b) => (b.userCount as number) - (a.userCount as number))
        setCache("iljuStats", result)
        return NextResponse.json({ data: result })
      }

      case "myGroup": {
        if (!userId) return NextResponse.json({ data: null })
        const myProfile = await SajuProfile.findOne({ userId }).lean()
        if (!myProfile?.mbti && !myProfile?.ilju) {
          return NextResponse.json({ data: { needsProfile: true } })
        }

        const filter: Record<string, unknown> = { userId: { $ne: userId }, isPublic: true }
        if (myProfile.mbti) filter.mbti = myProfile.mbti
        if (myProfile.ilju) filter.ilju = myProfile.ilju

        let peers = await SajuProfile.find(filter, { userId: 1 }).lean()
        // 정확히 둘 다 매칭이 없으면 MBTI만으로
        if (peers.length === 0 && myProfile.mbti) {
          delete filter.ilju
          peers = await SajuProfile.find(filter, { userId: 1 }).lean()
        }

        const peerIds = peers.map(p => p.userId)
        const graves = await Grave.find({ userId: { $in: peerIds } }).lean()

        const causes: Record<string, number> = {}
        let totalDuration = 0, durationCount = 0
        for (const g of graves) {
          if (g.causeOfDeath) causes[g.causeOfDeath] = (causes[g.causeOfDeath] || 0) + 1
          if (g.relationshipStart && g.relationshipEnd) {
            const months = Math.round((new Date(g.relationshipEnd).getTime() - new Date(g.relationshipStart).getTime()) / (30 * 24 * 60 * 60 * 1000))
            if (months > 0 && months < 600) { totalDuration += months; durationCount++ }
          }
        }

        const topCauses = Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 3)

        return NextResponse.json({
          data: {
            mbti: myProfile.mbti,
            ilju: myProfile.ilju,
            element: myProfile.dominantElement,
            groupSize: peerIds.length,
            totalGraves: graves.length,
            avgGraveCount: peerIds.length > 0 ? Math.round(graves.length / peerIds.length * 10) / 10 : 0,
            avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
            topCauses,
          },
        })
      }

      // 데일리 사주
      case "daily": {
        if (!userId) return NextResponse.json({ data: null })
        const myProfile = await SajuProfile.findOne({ userId }).lean()
        const myGraves = await Grave.find({ userId }).lean()

        const today = new Date()
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        const dayElement = ["목", "화", "토", "금", "수"][(seed + (userId.charCodeAt(0) || 0)) % 5]

        const luckScore = 50 + ((seed * 7 + (userId.charCodeAt(2) || 0) * 13) % 51) // 50~100

        const graveCount = myGraves.length
        const dominantElement = myProfile?.dominantElement || "수"

        // 묘비 구성별 맞춤 메시지
        let encouragement = ""
        if (graveCount === 0) {
          encouragement = "아직 묻힌 연애가 없네요. 그건 아직 최고의 연애가 기다리고 있다는 뜻이에요."
        } else if (graveCount === 1) {
          encouragement = "한 번의 이별을 겪었군요. 그 경험이 다음 사랑을 더 깊게 만들어줄 거예요."
        } else if (graveCount <= 3) {
          encouragement = "몇 번의 이별이 있었지만, 그만큼 사랑할 줄 아는 사람이라는 증거예요."
        } else {
          encouragement = "많은 사랑을 해봤군요. 당신은 이제 누구보다 사랑의 본질을 알고 있어요."
        }

        // 오행별 데일리 조언
        const elementAdvice: Record<string, string[]> = {
          목: [
            "오늘은 새로운 만남에 열린 마음을 가져보세요. 나무가 봄에 싹을 틔우듯.",
            "지금 마음에 두고 있는 사람에게 먼저 연락해보세요. 목 기운이 성장을 돕고 있어요.",
            "오늘은 자기 성장에 집중하기 좋은 날. 매력은 안에서 자라나는 거예요.",
          ],
          화: [
            "오늘의 열정을 사랑에 쏟아보세요. 불꽃처럼 뜨거운 고백이 통할 수 있어요.",
            "감정 표현을 아끼지 마세요. 오늘은 진심이 전달되는 날이에요.",
            "너무 뜨겁게 달리지 마세요. 적당한 온도가 관계를 오래 유지시켜요.",
          ],
          토: [
            "안정적인 에너지가 흐르는 날. 진지한 대화를 나눠보세요.",
            "지금 연애에서 중심을 잡아야 해요. 흔들리지 마세요, 당신이 옳았어요.",
            "오늘은 상대의 작은 배려에 감사를 표현하기 좋은 날이에요.",
          ],
          금: [
            "오늘은 단호함이 필요해요. 안 맞는 사람에게 시간을 낭비하지 마세요.",
            "날카로운 직감을 믿으세요. 오늘 만나는 사람이 운명일 수 있어요.",
            "때로는 벽을 허무는 것도 용기예요. 마음을 좀 더 열어보세요.",
          ],
          수: [
            "유연하게 흘러가세요. 물처럼 상대에게 맞춰주면 좋은 일이 생길 거예요.",
            "오늘은 감성이 풍부한 날. 편지나 긴 메시지를 보내보세요.",
            "직감이 예리한 날이에요. 어떤 사람이 나에게 맞는지 느껴질 거예요.",
          ],
        }

        const adviceList = elementAdvice[dominantElement] || elementAdvice["수"]
        const todayAdvice = adviceList[seed % adviceList.length]

        return NextResponse.json({
          data: {
            date: today.toISOString().split("T")[0],
            dayElement,
            luckScore,
            todayAdvice,
            encouragement,
            graveCount,
            dominantElement,
          },
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
