"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  SHOP_ITEMS,
  CATEGORY_NAMES,
  RARITY_COLORS,
  RARITY_BG,
  RARITY_NAMES,
  type ShopItem,
} from "@/lib/shop-items"
import { dbUser } from "@/lib/api-client"
import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"

export default function ShopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coins, setCoinsState] = useState(0)
  const [ownedItems, setOwnedItems] = useState<Array<{ itemId: string; purchasedAt: string; equippedOn?: string }>>([])
  const [selectedCategory, setSelectedCategory] = useState<ShopItem["category"] | "all">("all")
  const [buyAnimation, setBuyAnimation] = useState<string | null>(null)

  const userId = (session?.user as { id?: string })?.id

  const reload = async () => {
    if (!userId) return
    const data = await dbUser.get(userId)
    setCoinsState(data?.coins || 0)
    setOwnedItems(data?.ownedItems || [])
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    reload()
  }, [userId, status, router])

  const handleBuy = async (item: ShopItem) => {
    if (!userId) return
    if (isOwned(item.id)) return

    const result = await dbUser.spendCoins(userId, item.price)
    if (!result) {
      alert("코인이 부족해요!")
      return
    }

    await dbUser.addItem(userId, item.id)
    await reload()
    setBuyAnimation(item.id)
    setTimeout(() => setBuyAnimation(null), 800)
  }

  const isOwned = (itemId: string) =>
    ownedItems.some((o) => o.itemId === itemId)

  const filteredItems =
    selectedCategory === "all"
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((i) => i.category === selectedCategory)

  if (status === "loading") {
    return <div className="text-center py-20 text-cemetery-ghost">로딩 중...</div>
  }

  return (
    <div className="space-y-8">
      {/* 상점 헤더 - 픽셀 스타일 */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <PixelArt grid={PIXEL_ARTS["ghost-main"]} scale={5} animated />
        </div>
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">
          추모 상점
        </h1>
        <p className="text-cemetery-ghost text-sm">
          묘비를 꾸밀 아이템을 구매하세요
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-cemetery-card border border-yellow-500/30 rounded-full">
          <span className="text-yellow-400 font-bold text-lg pixel-text">{coins}</span>
          <span className="text-cemetery-ghost text-sm">코인</span>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
        <CategoryTab label="전체" active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
        {(Object.entries(CATEGORY_NAMES) as [ShopItem["category"], string][]).map(
          ([key, label]) => (
            <CategoryTab key={key} label={label} active={selectedCategory === key} onClick={() => setSelectedCategory(key)} />
          )
        )}
      </div>

      {/* 아이템 그리드 - 픽셀아트 스타일 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const owned = isOwned(item.id)
          const buying = buyAnimation === item.id
          const pixelGrid = PIXEL_ARTS[item.pixelArtId]

          return (
            <div
              key={item.id}
              className={`relative rounded-xl border p-4 transition-all duration-300 ${RARITY_BG[item.rarity]}
                ${owned ? "bg-cemetery-surface/50 opacity-60" : "bg-cemetery-card tombstone-hover"}
                ${buying ? "scale-105 ring-2 ring-yellow-400/50" : ""}`}
            >
              {/* 레어리티 뱃지 */}
              <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-cemetery-bg/50 ${RARITY_COLORS[item.rarity]}`}>
                {RARITY_NAMES[item.rarity]}
              </span>

              {/* 픽셀아트 아이템 */}
              <div className="flex justify-center py-4">
                {pixelGrid ? (
                  <PixelArt grid={pixelGrid} scale={4} animated={buying} />
                ) : (
                  <div className="w-10 h-10 bg-cemetery-surface rounded" />
                )}
              </div>

              {/* 정보 */}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-cemetery-heading text-sm text-center">
                  {item.name}
                </h3>
                <p className="text-cemetery-ghost/50 text-[11px] text-center leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 구매 버튼 */}
              <div className="mt-3">
                {owned ? (
                  <div className="w-full py-2 text-center text-xs text-cemetery-ghost/40 bg-cemetery-surface rounded-lg border border-cemetery-border/50">
                    보유중 ✓
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={coins < item.price}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-all
                      ${coins >= item.price
                        ? "bg-cemetery-accent hover:bg-cemetery-accent-dim active:scale-95"
                        : "bg-cemetery-surface text-cemetery-ghost/30 cursor-not-allowed"
                      }`}
                  >
                    {coins >= item.price ? `🪙 ${item.price}` : `🔒 ${item.price}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 보유 아이템 */}
      {ownedItems.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-cemetery-border">
          <h2 className="font-gothic text-xl text-cemetery-heading">
            내 아이템 ({ownedItems.length}개)
          </h2>
          <div className="flex flex-wrap gap-4">
            {ownedItems.map((owned, idx) => {
              const item = SHOP_ITEMS.find((i) => i.id === owned.itemId)
              if (!item) return null
              const pixelGrid = PIXEL_ARTS[item.pixelArtId]
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${RARITY_BG[item.rarity]} bg-cemetery-card`}
                >
                  {pixelGrid && <PixelArt grid={pixelGrid} scale={3} />}
                  <span className="text-[10px] text-cemetery-text">{item.name}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function CategoryTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all
        ${active
          ? "bg-cemetery-accent text-white"
          : "bg-cemetery-card border border-cemetery-border text-cemetery-ghost hover:border-cemetery-accent"
        }`}
    >
      {label}
    </button>
  )
}
