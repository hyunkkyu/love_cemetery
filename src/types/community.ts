export type PostCategory = "talk" | "saju" | "advice" | "match"

export const POST_CATEGORIES: Record<PostCategory, { name: string; emoji: string; color: string }> = {
  talk: { name: "연애토크", emoji: "💀", color: "text-purple-400" },
  saju: { name: "사주해석", emoji: "🔮", color: "text-blue-400" },
  advice: { name: "고민상담", emoji: "👻", color: "text-green-400" },
  match: { name: "궁합추천", emoji: "💘", color: "text-pink-400" },
}

export interface Post {
  id: string
  userId: string
  nickname: string
  category: PostCategory
  title: string
  content: string
  tags: string[]
  likes: number
  likedBy: string[]
  viewCount: number
  attachedSaju?: unknown
  attachedCompatibility?: unknown
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  postId: string
  userId: string
  nickname: string
  content: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface SajuProfile {
  id: string
  userId: string
  nickname: string
  birthDate: string
  birthTime: string
  dominantElement: string
  elementBalance: Record<string, number>
  lookingFor: string
  introduction: string
  isPublic: boolean
  createdAt: string
}
