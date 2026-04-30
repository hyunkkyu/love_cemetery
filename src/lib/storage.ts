import type { Grave } from "@/types"

function getStorageKey(userId: string): string {
  return `love-cemetery-${userId}`
}

function getCoinsKey(userId: string): string {
  return `love-cemetery-coins-${userId}`
}

function getItemsKey(userId: string): string {
  return `love-cemetery-items-${userId}`
}

export function loadGraves(userId?: string): Grave[] {
  if (typeof window === "undefined") return []
  const key = userId ? getStorageKey(userId) : "love-cemetery-graves"
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGrave(grave: Grave, userId?: string): Grave[] {
  const key = userId ? getStorageKey(userId) : "love-cemetery-graves"
  const graves = loadGraves(userId)
  const existing = graves.findIndex((g) => g.id === grave.id)
  const updated =
    existing >= 0
      ? graves.map((g) => (g.id === grave.id ? grave : g))
      : [...graves, grave]
  localStorage.setItem(key, JSON.stringify(updated))
  return updated
}

export function deleteGrave(id: string, userId?: string): Grave[] {
  const key = userId ? getStorageKey(userId) : "love-cemetery-graves"
  const graves = loadGraves(userId).filter((g) => g.id !== id)
  localStorage.setItem(key, JSON.stringify(graves))
  return graves
}

export function getGrave(id: string, userId?: string): Grave | undefined {
  return loadGraves(userId).find((g) => g.id === id)
}

// 코인 시스템
export function getCoins(userId: string): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = localStorage.getItem(getCoinsKey(userId))
    return raw ? parseInt(raw) : 500 // 초기 500코인
  } catch {
    return 100
  }
}

export function setCoins(userId: string, amount: number): void {
  localStorage.setItem(getCoinsKey(userId), String(amount))
}

export function addCoins(userId: string, amount: number): number {
  const current = getCoins(userId)
  const newAmount = current + amount
  setCoins(userId, newAmount)
  return newAmount
}

export function spendCoins(userId: string, amount: number): boolean {
  const current = getCoins(userId)
  if (current < amount) return false
  setCoins(userId, current - amount)
  return true
}

// 아이템 시스템
export interface OwnedItem {
  itemId: string
  purchasedAt: string
  equippedOn?: string // graveId에 장착
}

export function getOwnedItems(userId: string): OwnedItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getItemsKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addOwnedItem(userId: string, itemId: string): OwnedItem[] {
  const items = getOwnedItems(userId)
  const newItem: OwnedItem = { itemId, purchasedAt: new Date().toISOString() }
  const updated = [...items, newItem]
  localStorage.setItem(getItemsKey(userId), JSON.stringify(updated))
  return updated
}

export function equipItem(userId: string, itemId: string, graveId: string): OwnedItem[] {
  const items = getOwnedItems(userId)
  const updated = items.map((item) =>
    item.itemId === itemId ? { ...item, equippedOn: graveId } : item
  )
  localStorage.setItem(getItemsKey(userId), JSON.stringify(updated))
  return updated
}

export function unequipItem(userId: string, itemId: string): OwnedItem[] {
  const items = getOwnedItems(userId)
  const updated = items.map((item) =>
    item.itemId === itemId ? { ...item, equippedOn: undefined } : item
  )
  localStorage.setItem(getItemsKey(userId), JSON.stringify(updated))
  return updated
}

export function getEquippedItems(userId: string, graveId: string): OwnedItem[] {
  return getOwnedItems(userId).filter((item) => item.equippedOn === graveId)
}

// 현재 썸 저장
export interface SavedCrush {
  id: string
  nickname: string
  birthDate: string
  birthTime: string
  persona: string
  chatStyle: string
  savedAt: string
}

function getCrushKey(userId: string): string {
  return `love-cemetery-crushes-${userId}`
}

export function loadCrushes(userId: string): SavedCrush[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getCrushKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCrush(userId: string, crush: SavedCrush): SavedCrush[] {
  const crushes = loadCrushes(userId)
  const existing = crushes.findIndex((c) => c.id === crush.id)
  const updated = existing >= 0
    ? crushes.map((c) => (c.id === crush.id ? crush : c))
    : [...crushes, crush]
  localStorage.setItem(getCrushKey(userId), JSON.stringify(updated))
  return updated
}

export function deleteCrush(userId: string, id: string): SavedCrush[] {
  const crushes = loadCrushes(userId).filter((c) => c.id !== id)
  localStorage.setItem(getCrushKey(userId), JSON.stringify(crushes))
  return crushes
}

// 분석 기록 저장
export interface AnalysisRecord {
  id: string
  crushName: string
  comparedWith?: string
  score: number
  aiAdvice: string
  createdAt: string
}

function getAnalysisKey(userId: string): string {
  return `love-cemetery-analysis-${userId}`
}

export function loadAnalysisRecords(userId: string): AnalysisRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getAnalysisKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAnalysisRecord(userId: string, record: AnalysisRecord): AnalysisRecord[] {
  const records = loadAnalysisRecords(userId)
  const updated = [record, ...records].slice(0, 30) // 최근 30개만
  localStorage.setItem(getAnalysisKey(userId), JSON.stringify(updated))
  return updated
}

export function deleteAnalysisRecord(userId: string, id: string): AnalysisRecord[] {
  const records = loadAnalysisRecords(userId).filter((r) => r.id !== id)
  localStorage.setItem(getAnalysisKey(userId), JSON.stringify(records))
  return records
}
