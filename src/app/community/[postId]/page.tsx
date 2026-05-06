"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { dbPosts } from "@/lib/community-client"
import { CommentSection } from "@/components/community/CommentSection"
import { POST_CATEGORIES, type Post } from "@/types/community"

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const userId = (session?.user as { id?: string })?.id

  const [post, setPost] = useState<Post | null>(null)

  useEffect(() => {
    dbPosts.get(postId).then((res) => setPost(res.data))
  }, [postId])

  const handleLike = async () => {
    if (!userId || !post) return
    const res = await dbPosts.like(userId, post.id)
    setPost((prev) => prev ? {
      ...prev,
      likes: res.data.likes,
      likedBy: res.data.liked
        ? [...(prev.likedBy || []), userId]
        : (prev.likedBy || []).filter((id) => id !== userId),
    } : null)
  }

  const handleDelete = async () => {
    if (!userId || !post || !confirm("글을 삭제할까요?")) return
    await dbPosts.delete(userId, post.id)
    router.push("/community")
  }

  if (!post) {
    return <div className="text-center py-20 text-cemetery-ghost/40">로딩 중...</div>
  }

  const cat = POST_CATEGORIES[post.category]
  const isAuthor = userId === post.userId
  const isLiked = post.likedBy?.includes(userId || "")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <a href="/community" className="text-sm text-cemetery-ghost/40 hover:text-cemetery-ghost transition-colors">
        ← 커뮤니티
      </a>

      {/* 게시글 */}
      <article className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-cemetery-surface ${cat.color}`}>
              {cat.emoji} {cat.name}
            </span>
            {post.tags?.map((tag) => (
              <span key={tag} className="text-[10px] text-cemetery-ghost/30">#{tag}</span>
            ))}
          </div>
          {isAuthor && (
            <button
              onClick={handleDelete}
              className="text-[10px] text-cemetery-ghost/30 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          )}
        </div>

        {/* 제목 */}
        <h1 className="font-gothic text-xl font-bold text-cemetery-heading">
          {post.title}
        </h1>

        {/* 메타 */}
        <div className="flex items-center gap-3 text-xs text-cemetery-ghost/40">
          <span className="text-cemetery-accent">{post.nickname}</span>
          <span>{new Date(post.createdAt).toLocaleString("ko-KR")}</span>
          <span>👁️ {post.viewCount}</span>
        </div>

        {/* 본문 */}
        <div className="text-sm text-cemetery-text leading-relaxed whitespace-pre-wrap py-2">
          {post.content}
        </div>

        {/* 향피우기 */}
        <div className="flex items-center gap-4 pt-2 border-t border-cemetery-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all cute-press
              ${isLiked
                ? "bg-orange-500/20 text-orange-300"
                : "bg-cemetery-surface text-cemetery-ghost/50 hover:text-cemetery-ghost"
              }`}
          >
            🪔 {isLiked ? "향을 피웠어요" : "향 피우기"} {post.likes}
          </button>
        </div>
      </article>

      {/* 댓글 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-6">
        <CommentSection postId={post.id} />
      </div>
    </div>
  )
}
