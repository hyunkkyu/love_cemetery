"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { dbUser } from "@/lib/api-client"
import { SHOP_ITEMS } from "@/lib/shop-items"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"

interface ItemPosition {
  itemId: string
  x: number
  y: number
  scale?: number // 1~6, 기본 3
}

interface OwnedItem { itemId: string; equippedOn?: string }

export function DraggableItems({ graveId }: { graveId: string }) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [equipped, setEquipped] = useState<OwnedItem[]>([])
  const [positions, setPositions] = useState<ItemPosition[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    dbUser.get(userId).then((data) => {
      const items = (data?.ownedItems || []).filter((i: OwnedItem) => i.equippedOn === graveId)
      setEquipped(items)

      const savedPositions = data?.itemPositions?.[graveId] || []
      const allPositions = items.map((item: OwnedItem, i: number) => {
        const existing = savedPositions.find((p: ItemPosition) => p.itemId === item.itemId)
        if (existing) return { scale: 3, ...existing }
        return { itemId: item.itemId, x: 20 + (i % 4) * 25, y: 30 + Math.floor(i / 4) * 30, scale: 3 }
      })
      setPositions(allPositions)
    }).catch(() => {})
  }, [userId, graveId])

  if (!userId || equipped.length === 0) return null

  const savePositions = () => {
    dbUser.savePositions(userId, graveId, positions).catch(() => {})
  }

  const handlePointerDown = (itemId: string) => {
    setDragging(itemId)
    setSelected(itemId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPositions((prev) =>
      prev.map((p) =>
        p.itemId === dragging
          ? { ...p, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) }
          : p
      )
    )
  }

  const handlePointerUp = () => {
    if (dragging) savePositions()
    setDragging(null)
  }

  const handleResize = (itemId: string, delta: number) => {
    setPositions((prev) =>
      prev.map((p) =>
        p.itemId === itemId
          ? { ...p, scale: Math.max(1, Math.min(6, (p.scale || 3) + delta)) }
          : p
      )
    )
    // 약간의 딜레이 후 저장
    setTimeout(() => {
      dbUser.savePositions(userId, graveId, positions).catch(() => {})
    }, 300)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[200px] pointer-events-auto"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={() => setSelected(null)}
    >
      {positions.map((pos) => {
        const item = SHOP_ITEMS.find((i) => i.id === pos.itemId)
        if (!item) return null
        const pixelGrid = PIXEL_ARTS[item.pixelArtId]
        if (!pixelGrid) return null
        const isDragging = dragging === pos.itemId
        const isSelected = selected === pos.itemId
        const itemScale = pos.scale || 3

        return (
          <div
            key={pos.itemId}
            className={"absolute select-none " +
              (isDragging ? "z-50 cursor-grabbing" : "z-10 cursor-grab hover:z-20")}
            style={{
              left: pos.x + "%",
              top: pos.y + "%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : pos.itemId) }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePointerDown(pos.itemId)
            }}
          >
            <div className={"transition-all " +
              (isDragging ? "drop-shadow-[0_0_10px_rgba(107,92,231,0.5)]" : "") +
              (isSelected ? " ring-2 ring-cemetery-accent/50 rounded-lg" : "")}>
              <PixelArt grid={pixelGrid} scale={itemScale} animated={isDragging} />
            </div>

            {/* 크기 조절 버튼 */}
            {isSelected && !isDragging && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex gap-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleResize(pos.itemId, -1) }}
                  className="w-6 h-6 bg-cemetery-card border border-cemetery-border rounded text-xs text-cemetery-ghost hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-6 h-6 flex items-center justify-center text-[9px] text-cemetery-ghost/40">
                  {itemScale}
                </span>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleResize(pos.itemId, 1) }}
                  className="w-6 h-6 bg-cemetery-card border border-cemetery-border rounded text-xs text-cemetery-ghost hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
