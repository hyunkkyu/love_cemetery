"use client"

import type { Post } from "@/types/community"
import { POST_CATEGORIES } from "@/types/community"

export function PostCard({ post }: { post: Post }) {
  const cat = POST_CATEGORIES[post.category]
  const timeAgo = getTimeAgo(post.createdAt)

  return (
    <a
      href={`/community/${post.id}`}
      className="block bg-cemetery-card border border-cemetery-border rounded-2xl p-4 tombstone-hover transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{cat.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-cemetery-surface ${cat.color}`}>
              {cat.name}
            </span>
            {!!post.attachedSaju && (
              <span className="text-[10px] text-cemetery-ghost/40">🔮 사주첨부</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-cemetery-heading truncate">
            {post.title}
          </h3>
          <p className="text-xs text-cemetery-ghost/50 mt-1 line-clamp-2">
            {post.content}
          </p>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-cemetery-ghost/40">
            <span>{post.nickname}</span>
            <span>{timeAgo}</span>
            <span>👻 {post.likes}</span>
            <span>👁️ {post.viewCount}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "방금"
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR")
}
