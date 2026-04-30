"use client"

import type { Grave } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { useSession } from "next-auth/react"
import { EquippedItemsMini } from "@/components/ItemEquipPanel"

interface GraveCardProps {
  grave: Grave
  onSelect?: (grave: Grave) => void
  selected?: boolean
}

export function GraveCard({ grave, onSelect, selected }: GraveCardProps) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const startYear = grave.relationshipStart ? new Date(grave.relationshipStart).getFullYear() : "?"
  const endYear = grave.relationshipEnd ? new Date(grave.relationshipEnd).getFullYear() : "?"
  const gradeInfo = GRAVE_GRADES[grave.grade || "public"]

  return (
    <a
      href={onSelect ? undefined : `/grave/${grave.id}`}
      onClick={onSelect ? () => onSelect(grave) : undefined}
      className={`tombstone-hover block cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
        selected
          ? "border-cemetery-accent bg-cemetery-accent/10"
          : `border-cemetery-border/60 ${gradeInfo.bg}`
      }`}
    >
      {/* 묘비 상단 */}
      <div className="bg-tombstone relative pt-6 pb-4 px-6 text-center">
        {/* 등급 뱃지 */}
        <div className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-cemetery-bg/40 ${gradeInfo.color} flex items-center gap-1`}>
          <span>{gradeInfo.emoji}</span>
          <span>{gradeInfo.name}</span>
        </div>

        <div className="absolute top-2 right-2">
          <span className="candle-glow inline-block text-sm">🕯️</span>
        </div>

        {/* 영정 사진 */}
        {grave.photo ? (
          <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border-2 border-cemetery-ghost/30 mb-2
            shadow-[0_0_12px_rgba(107,92,231,0.25)]">
            <img src={grave.photo} alt={grave.nickname} className="w-full h-full object-cover grayscale-[30%]" />
          </div>
        ) : (
          <div className="mx-auto w-16 h-16 rounded-full bg-cemetery-surface/50 flex items-center justify-center mb-2 border border-cemetery-border">
            <span className="text-2xl ghost-float">👻</span>
          </div>
        )}

        <h3 className="font-gothic text-lg font-bold text-cemetery-heading">
          {grave.nickname}
        </h3>

        <p className="text-cemetery-ghost/50 text-xs mt-1 font-gothic">
          {startYear} — {endYear}
        </p>
      </div>

      {/* 장착 아이템 */}
      <EquippedItemsMini userId={userId} graveId={grave.id} />

      {/* 묘비 하단 */}
      <div className="px-4 pb-4 pt-2 space-y-2.5">
        {grave.epitaph && (
          <p className="text-cemetery-ghost text-xs italic text-center line-clamp-2">
            &ldquo;{grave.epitaph}&rdquo;
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-cemetery-ghost/50">
          <span>{grave.causeOfDeath || "사인 미상"}</span>
          {grave.compatibility && (
            <span className="text-cemetery-accent font-semibold">
              ♥ {grave.compatibility.score}%
            </span>
          )}
        </div>

        {/* 분석 뱃지들 */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {grave.chatAnalysis && (
            <span className="px-2 py-0.5 text-[10px] bg-cemetery-surface/80 rounded-full text-cemetery-ghost/60">
              💬 카톡
            </span>
          )}
          {grave.manseryeok && (
            <span className="px-2 py-0.5 text-[10px] bg-cemetery-surface/80 rounded-full text-cemetery-ghost/60">
              🔮 사주
            </span>
          )}
          {grave.chatSamples && grave.chatSamples.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] bg-cemetery-surface/80 rounded-full text-cemetery-ghost/60">
              👻 대화
            </span>
          )}
        </div>
      </div>
    </a>
  )
}
