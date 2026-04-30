"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { dbUser } from "@/lib/api-client"
import { SHOP_ITEMS } from "@/lib/shop-items"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"

interface OwnedItem { itemId: string; purchasedAt: string; equippedOn?: string }

interface ItemEquipPanelProps {
  graveId: string
}

export function ItemEquipPanel({ graveId }: ItemEquipPanelProps) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([])
  const [showPanel, setShowPanel] = useState(false)

  const reload = async () => {
    if (!userId) return
    try {
      const data = await dbUser.get(userId)
      setOwnedItems(data?.ownedItems || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { reload() }, [userId])

  if (!userId) return null

  const equipped = ownedItems.filter((o) => o.equippedOn === graveId)
  const available = ownedItems.filter((o) => !o.equippedOn || o.equippedOn === graveId)

  const handleEquip = async (itemId: string) => {
    try {
      await dbUser.equipItem(userId, itemId, graveId)
      await reload()
    } catch { /* ignore */ }
  }

  const handleUnequip = async (itemId: string) => {
    try {
      await dbUser.unequipItem(userId, itemId)
      await reload()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      <EquippedItemsDisplay equipped={equipped} />

      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full py-3 bg-cemetery-card border border-dashed border-cemetery-border
          hover:border-cemetery-accent rounded-2xl transition-all text-sm text-cemetery-ghost
          hover:text-cemetery-heading"
      >
        {showPanel ? "✕ 닫기" : "✨ 아이템 꾸미기"}
      </button>

      {showPanel && (
        <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-cemetery-heading">
            보유 아이템에서 골라 장착하세요
          </h3>

          {available.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-cemetery-ghost/50 text-sm">보유한 아이템이 없어요</p>
              <a href="/shop" className="text-cemetery-accent text-xs mt-2 inline-block hover:underline">
                상점에서 구매하기 →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {available.map((owned) => {
                const item = SHOP_ITEMS.find((i) => i.id === owned.itemId)
                if (!item) return null
                const isEquipped = owned.equippedOn === graveId
                const pixelGrid = PIXEL_ARTS[item.pixelArtId]

                return (
                  <button
                    key={owned.itemId}
                    onClick={() => isEquipped ? handleUnequip(owned.itemId) : handleEquip(owned.itemId)}
                    className={"relative p-3 rounded-xl border transition-all text-center " +
                      (isEquipped
                        ? "border-cemetery-accent bg-cemetery-accent/10 ring-2 ring-cemetery-accent/30"
                        : "border-cemetery-border bg-cemetery-surface hover:border-cemetery-ghost/40"
                      )}
                  >
                    {isEquipped && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-cemetery-accent rounded-full text-[10px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                    <div className="flex justify-center mb-1">
                      {pixelGrid ? <PixelArt grid={pixelGrid} scale={3} /> : <div className="w-8 h-8" />}
                    </div>
                    <p className="text-[10px] text-cemetery-text truncate">{item.name}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EquippedItemsDisplay({ equipped }: { equipped: OwnedItem[] }) {
  if (equipped.length === 0) return null
  return (
    <div className="flex flex-wrap justify-center gap-3 py-3">
      {equipped.map((owned) => {
        const item = SHOP_ITEMS.find((i) => i.id === owned.itemId)
        if (!item) return null
        const pixelGrid = PIXEL_ARTS[item.pixelArtId]
        return (
          <div key={owned.itemId} className="flex flex-col items-center gap-1 animate-fade-in">
            {pixelGrid && <PixelArt grid={pixelGrid} scale={3} animated />}
            <span className="text-[9px] text-cemetery-ghost/50">{item.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export function EquippedItemsMini({ userId, graveId }: { userId?: string; graveId: string }) {
  const [equipped, setEquipped] = useState<OwnedItem[]>([])

  useEffect(() => {
    if (!userId) return
    dbUser.get(userId).then((data) => {
      const items = (data?.ownedItems || []).filter((i: OwnedItem) => i.equippedOn === graveId)
      setEquipped(items)
    }).catch(() => {})
  }, [userId, graveId])

  if (equipped.length === 0) return null

  return (
    <div className="flex justify-center gap-1.5 py-1">
      {equipped.slice(0, 5).map((owned) => {
        const item = SHOP_ITEMS.find((i) => i.id === owned.itemId)
        if (!item) return null
        const pixelGrid = PIXEL_ARTS[item.pixelArtId]
        return pixelGrid ? <PixelArt key={owned.itemId} grid={pixelGrid} scale={2} /> : null
      })}
      {equipped.length > 5 && (
        <span className="text-[9px] text-cemetery-ghost/40">+{equipped.length - 5}</span>
      )}
    </div>
  )
}
