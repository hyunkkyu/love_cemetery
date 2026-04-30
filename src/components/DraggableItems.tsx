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
}

interface OwnedItem { itemId: string; equippedOn?: string }

export function DraggableItems({ graveId }: { graveId: string }) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [equipped, setEquipped] = useState<OwnedItem[]>([])
  const [positions, setPositions] = useState<ItemPosition[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    dbUser.get(userId).then((data) => {
      const items = (data?.ownedItems || []).filter((i: OwnedItem) => i.equippedOn === graveId)
      setEquipped(items)

      // 위치 복원
      const savedPositions = data?.itemPositions?.[graveId] || []
      const allPositions = items.map((item: OwnedItem, i: number) => {
        const existing = savedPositions.find((p: ItemPosition) => p.itemId === item.itemId)
        if (existing) return existing
        return { itemId: item.itemId, x: 20 + (i % 4) * 25, y: 30 + Math.floor(i / 4) * 30 }
      })
      setPositions(allPositions)
    }).catch(() => {})
  }, [userId, graveId])

  if (!userId || equipped.length === 0) return null

  const handlePointerDown = (itemId: string) => {
    setDragging(itemId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPositions((prev) =>
      prev.map((p) =>
        p.itemId === dragging
          ? { ...p, x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(90, y)) }
          : p
      )
    )
  }

  const handlePointerUp = () => {
    if (dragging && userId) {
      dbUser.savePositions(userId, graveId, positions).catch(() => {})
    }
    setDragging(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[200px] pointer-events-auto"
      style={{ touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {positions.map((pos) => {
        const item = SHOP_ITEMS.find((i) => i.id === pos.itemId)
        if (!item) return null
        const pixelGrid = PIXEL_ARTS[item.pixelArtId]
        if (!pixelGrid) return null
        const isDragging = dragging === pos.itemId

        return (
          <div
            key={pos.itemId}
            className={"absolute cursor-grab select-none transition-shadow " +
              (isDragging ? "z-50 cursor-grabbing drop-shadow-[0_0_10px_rgba(107,92,231,0.5)]" : "z-10 hover:z-20")}
            style={{
              left: pos.x + "%",
              top: pos.y + "%",
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              handlePointerDown(pos.itemId)
            }}
          >
            <div className={"transition-transform " + (isDragging ? "scale-125" : "hover:scale-110")}>
              <PixelArt grid={pixelGrid} scale={3} animated={isDragging} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
