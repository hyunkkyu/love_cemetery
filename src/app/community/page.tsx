"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { dbPosts } from "@/lib/community-client"
import { PostCard } from "@/components/community/PostCard"
import { POST_CATEGORIES, type PostCategory, type Post } from "@/types/community"

export default function CommunityPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<PostCategory | "">("")
  const [sort, setSort] = useState<"latest" | "popular">("latest")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    const res = await dbPosts.list(category || undefined, sort, page)
    setPosts(res.data || [])
    setTotal(res.total || 0)
    setLoading(false)
  }

  useEffect(() => { reload() }, [category, sort, page])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
            👻 커뮤니티
          </h1>
          <p className="text-xs text-cemetery-ghost/40 mt-1">유령들의 연애 이야기</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/community/match"
            className="px-3 py-2 text-xs bg-pink-500/10 border border-pink-500/20 text-pink-300
              rounded-xl hover:bg-pink-500/20 transition-colors"
          >
            💘 궁합매칭
          </a>
          {session && (
            <a
              href="/community/write"
              className="px-4 py-2 text-sm bg-cemetery-accent hover:bg-cemetery-accent-dim
                rounded-xl transition-colors cute-press"
            >
              ✏️ 글쓰기
            </a>
          )}
        </div>
      </div>

      {/* 카테고리 + 정렬 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setCategory(""); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors
              ${!category ? "bg-cemetery-accent text-white" : "bg-cemetery-card border border-cemetery-border text-cemetery-ghost"}`}
          >
            전체
          </button>
          {(Object.entries(POST_CATEGORIES) as [PostCategory, { name: string; emoji: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setCategory(key); setPage(0) }}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors
                ${category === key ? "bg-cemetery-accent text-white" : "bg-cemetery-card border border-cemetery-border text-cemetery-ghost"}`}
            >
              {val.emoji} {val.name}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "latest" | "popular")}
          className="text-xs bg-cemetery-surface border border-cemetery-border rounded-lg px-2 py-1.5
            text-cemetery-ghost focus:outline-none"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="text-center py-12 text-cemetery-ghost/40 text-sm">로딩 중...</div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div key={post.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <span className="text-4xl ghost-float inline-block">👻</span>
          <p className="text-cemetery-ghost/40">아직 유령들의 이야기가 없습니다</p>
          {session && (
            <a href="/community/write" className="text-xs text-cemetery-accent hover:underline">
              첫 번째 글을 써보세요 →
            </a>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs bg-cemetery-card border border-cemetery-border rounded-lg
              disabled:opacity-30 hover:border-cemetery-accent transition-colors"
          >
            ← 이전
          </button>
          <span className="text-xs text-cemetery-ghost/40 self-center">
            {page + 1} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * 20 >= total}
            className="px-3 py-1.5 text-xs bg-cemetery-card border border-cemetery-border rounded-lg
              disabled:opacity-30 hover:border-cemetery-accent transition-colors"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  )
}
