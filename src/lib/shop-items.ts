export interface ShopItem {
  id: string
  name: string
  pixelArtId: string
  description: string
  price: number
  category: "flower" | "candle" | "deco" | "stone" | "curse" | "special"
  rarity: "common" | "rare" | "epic" | "legendary"
}

export const SHOP_ITEMS: ShopItem[] = [
  // 꽃
  { id: "flower-rose", name: "빨간 장미", pixelArtId: "flower-rose", description: "아직 미련이 남았나봐요.", price: 10, category: "flower", rarity: "common" },
  { id: "flower-tulip", name: "튤립 한 다발", pixelArtId: "flower-tulip", description: "새 시작을 응원하는 꽃다발", price: 15, category: "flower", rarity: "common" },
  { id: "flower-sunflower", name: "해바라기", pixelArtId: "flower-sunflower", description: "밝았던 시절을 기억하며", price: 20, category: "flower", rarity: "rare" },
  { id: "flower-cherry", name: "벚꽃 가지", pixelArtId: "flower-cherry", description: "짧지만 아름다웠던 인연", price: 25, category: "flower", rarity: "rare" },
  { id: "flower-bouquet", name: "영면 꽃다발", pixelArtId: "flower-bouquet", description: "모든 감정을 담은 마지막 꽃다발", price: 50, category: "flower", rarity: "epic" },

  // 초
  { id: "candle-white", name: "흰 초", pixelArtId: "candle-white", description: "조용히 추모하는 작은 불꽃", price: 5, category: "candle", rarity: "common" },
  { id: "candle-scented", name: "향초", pixelArtId: "candle-scented", description: "바닐라 향이 추억을 불러일으켜요", price: 15, category: "candle", rarity: "common" },
  { id: "candle-eternal", name: "영원의 불꽃", pixelArtId: "candle-eternal", description: "절대 꺼지지 않는 불꽃", price: 80, category: "candle", rarity: "epic" },
  { id: "candle-lantern", name: "소원 등불", pixelArtId: "candle-lantern", description: "하늘로 올려보내는 마지막 소원", price: 100, category: "candle", rarity: "legendary" },

  // 장식
  { id: "deco-ribbon", name: "검은 리본", pixelArtId: "deco-ribbon", description: "애도의 표시", price: 8, category: "deco", rarity: "common" },
  { id: "deco-photo", name: "폴라로이드", pixelArtId: "deco-photo", description: "함께했던 순간을 담은 사진", price: 20, category: "deco", rarity: "rare" },
  { id: "deco-music", name: "오르골", pixelArtId: "deco-music", description: "우리의 노래가 흘러나와요", price: 30, category: "deco", rarity: "rare" },
  { id: "deco-heart-lock", name: "하트 자물쇠", pixelArtId: "deco-heart-lock", description: "열쇠는 이미 버렸지만...", price: 35, category: "deco", rarity: "rare" },
  { id: "deco-umbrella", name: "투명 우산", pixelArtId: "deco-umbrella", description: "비 오던 날의 기억", price: 25, category: "deco", rarity: "rare" },
  { id: "deco-crown", name: "꽃 왕관", pixelArtId: "deco-crown", description: "당신은 나의 왕이었어요", price: 60, category: "deco", rarity: "epic" },

  // 묘비석
  { id: "stone-marble", name: "대리석 묘비", pixelArtId: "stone-marble", description: "격조있는 이별의 고급 묘비", price: 40, category: "stone", rarity: "rare" },
  { id: "stone-crystal", name: "크리스탈 묘비", pixelArtId: "stone-crystal", description: "투명하게 빛나는 추억의 결정", price: 120, category: "stone", rarity: "epic" },
  { id: "stone-gold", name: "황금 묘비", pixelArtId: "stone-gold", description: "가장 소중했던 연애를 위한 최고급", price: 200, category: "stone", rarity: "legendary" },

  // 저주/호러
  { id: "curse-voodoo", name: "저주인형", pixelArtId: "special-voodoo", description: "바늘을 꽂으면 전 애인이 재채기해요", price: 35, category: "curse", rarity: "rare" },
  { id: "curse-blood", name: "핏자국", pixelArtId: "special-blood", description: "이별의 상처가 아직 덜 아물었나봐", price: 25, category: "curse", rarity: "rare" },
  { id: "curse-talisman", name: "복수 부적", pixelArtId: "special-talisman", description: "전 애인에게 불행을 (장난)", price: 45, category: "curse", rarity: "epic" },

  // 특별
  { id: "special-ghost", name: "수호 유령", pixelArtId: "special-ghost", description: "묘비를 지켜주는 귀여운 유령", price: 50, category: "special", rarity: "epic" },
  { id: "special-cat", name: "묘지 고양이", pixelArtId: "special-cat", description: "묘비 옆에 앉아있는 검은 고양이", price: 45, category: "special", rarity: "epic" },
  { id: "special-fairy", name: "추억 요정", pixelArtId: "special-fairy", description: "좋은 기억만 간직하게 해주는 요정", price: 150, category: "special", rarity: "legendary" },
  { id: "special-rainbow", name: "무지개 다리", pixelArtId: "special-rainbow", description: "연애가 무지개 다리를 건넜어요", price: 180, category: "special", rarity: "legendary" },
]

export const CATEGORY_NAMES: Record<ShopItem["category"], string> = {
  flower: "꽃",
  candle: "초",
  deco: "장식",
  stone: "묘비석",
  curse: "저주",
  special: "특별",
}

export const RARITY_COLORS: Record<ShopItem["rarity"], string> = {
  common: "text-cemetery-ghost",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
}

export const RARITY_BG: Record<ShopItem["rarity"], string> = {
  common: "border-cemetery-border",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
}

export const RARITY_NAMES: Record<ShopItem["rarity"], string> = {
  common: "일반",
  rare: "희귀",
  epic: "영웅",
  legendary: "전설",
}
