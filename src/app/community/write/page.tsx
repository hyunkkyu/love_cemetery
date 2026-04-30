"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbPosts } from "@/lib/community-client"
import { POST_CATEGORIES, type PostCategory } from "@/types/community"

export default function WritePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id
  const userName = session?.user?.name || ""

  const [category, setCategory] = useState<PostCategory>("talk")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!userId) {
      setError("로그인 세션이 없습니다. 로그아웃 후 다시 로그인해주세요.")
      return
    }
    if (title.trim().length < 2) {
      setError("제목을 2자 이상 입력해주세요.")
      return
    }
    if (content.trim().length < 10) {
      setError("내용을 10자 이상 입력해주세요.")
      return
    }
    setSubmitting(true)
    try {
      const res = await dbPosts.create(userId, {
        nickname: userName,
        category,
        title: title.trim(),
        content: content.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
      })
      if (res.data?.id) {
        window.location.href = `/community/${res.data.id}`
      } else {
        setError("글 작성에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "작성 실패")
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-cemetery-ghost">로그인이 필요합니다</p>
        <a href="/login" className="text-cemetery-accent text-sm mt-2 inline-block">로그인 →</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-gothic text-2xl text-cemetery-heading">✏️ 글쓰기</h1>
        <span className="text-xs text-yellow-400">🪙 작성하면 +10코인</span>
      </div>

      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-5">
        {/* 카테고리 */}
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-2">카테고리</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(POST_CATEGORIES) as [PostCategory, { name: string; emoji: string; color: string }][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all
                    ${category === key
                      ? "bg-cemetery-accent text-white"
                      : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-accent"
                    }`}
                >
                  {val.emoji} {val.name}
                </button>
              )
            )}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요 (2~50자)"
            maxLength={50}
            className="w-full px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
              text-cemetery-text placeholder-cemetery-ghost/30 text-sm
              focus:border-cemetery-accent focus:outline-none"
          />
        </div>

        {/* 본문 */}
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="자유롭게 작성해주세요..."
            rows={8}
            maxLength={5000}
            className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl
              text-cemetery-text placeholder-cemetery-ghost/30 text-sm resize-none
              focus:border-cemetery-accent focus:outline-none"
          />
          <p className="text-[10px] text-cemetery-ghost/30 text-right mt-1">{content.length}/5000</p>
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-xs text-cemetery-ghost/50 mb-1">태그 (쉼표로 구분, 최대 5개)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="예: 이별, 썸, 궁합"
            className="w-full px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
              text-cemetery-text placeholder-cemetery-ghost/30 text-sm
              focus:border-cemetery-accent focus:outline-none"
          />
        </div>

        {/* 디버그 정보 */}
        {!userId && (
          <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">
            ⚠️ 로그인 세션이 감지되지 않습니다. 로그아웃 후 다시 로그인해주세요.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">
            ⚠️ {error}
          </p>
        )}

        {/* 제출 */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-xl
              text-cemetery-ghost text-sm hover:border-cemetery-accent transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40
              rounded-xl text-sm font-semibold transition-colors cute-press"
          >
            {submitting ? "작성 중..." : "👻 글 올리기"}
          </button>
        </div>
      </div>
    </div>
  )
}
