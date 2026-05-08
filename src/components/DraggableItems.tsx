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
  scale?: number
}

interface OwnedItem { itemId: string; equippedOn?: string }

export function DraggableItems({ graveId }: { graveId: string }) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [equipped, setEquipped] = useState<OwnedItem[]>([])
  const [positions, setPositions] = useState<ItemPosition[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [didMove, setDidMove] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(positions)
  posRef.current = positions

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

  if (!userId || equipped.length === 0) return <div className="pointer-events-none" />

  const save = () => {
    dbUser.savePositions(userId, graveId, posRef.current).catch(() => {})
  }

  const handlePointerDown = (itemId: string) => {
    setDragging(itemId)
    setDidMove(false)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return
    setDidMove(true)
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

  const handlePointerUp = (itemId?: string) => {
    if (dragging) {
      if (didMove) {
        save()
      } else if (itemId) {
        // 클릭 (이동 안 함) → 선택 토글
        setSelected((prev) => prev === itemId ? null : itemId)
      }
    }
    setDragging(null)
    setDidMove(false)
  }

  const handleResize = (itemId: string, delta: number) => {
    const newPositions = positions.map((p) =>
      p.itemId === itemId
        ? { ...p, scale: Math.max(1, Math.min(8, (p.scale || 3) + delta)) }
        : p
    )
    setPositions(newPositions)
    posRef.current = newPositions
    save()
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[200px] pointer-events-auto"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => handlePointerUp()}
      onPointerLeave={() => { if (dragging) { save(); setDragging(null) } }}
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
              (isDragging ? "z-50 cursor-grabbing" : isSelected ? "z-40" : "z-10 cursor-grab hover:z-20")}
            style={{
              left: pos.x + "%",
              top: pos.y + "%",
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePointerDown(pos.itemId)
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              handlePointerUp(pos.itemId)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 클릭 영역 확대 (최소 40x40) */}
            <div className={"transition-all min-w-[40px] min-h-[40px] flex items-center justify-center " +
              (isDragging ? "drop-shadow-[0_0_10px_rgba(107,92,231,0.5)]" : "") +
              (isSelected && !isDragging ? " ring-2 ring-cemetery-accent rounded-lg p-1" : "")}>
              <PixelArt grid={pixelGrid} scale={itemScale} animated={isDragging} />
            </div>

            {/* 크기 조절 UI */}
            {isSelected && !isDragging && (
              <div
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 mt-1 z-[60] animate-fade-in"
                style={{ top: "100%" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleResize(pos.itemId, -1)}
                  className="w-9 h-9 bg-cemetery-card border border-cemetery-border rounded-full text-base text-cemetery-ghost
                    hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-xs text-cemetery-ghost/50 w-6 text-center">{itemScale}</span>
                <button
                  onClick={() => handleResize(pos.itemId, 1)}
                  className="w-9 h-9 bg-cemetery-card border border-cemetery-border rounded-full text-base text-cemetery-ghost
                    hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex items-center justify-center"
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
