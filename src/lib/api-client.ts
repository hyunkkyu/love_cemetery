/** 서버 DB API 클라이언트 */

async function callAPI(action: string, _userId: string, payload: Record<string, unknown> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      throw new Error(json.error || `API 오류: ${res.status}`)
    }
    return json.data
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const dbGraves = {
  list: (userId: string) => callAPI("graves.list", userId),
  get: (userId: string, graveId: string) => callAPI("graves.get", userId, { graveId }),
  save: (userId: string, grave: Record<string, unknown>) => callAPI("graves.save", userId, { grave }),
  delete: (userId: string, graveId: string) => callAPI("graves.delete", userId, { graveId }),
}

export const dbUser = {
  get: (userId: string) => callAPI("user.get", userId),
  addCoins: (userId: string, amount: number) => callAPI("user.addCoins", userId, { amount }),
  spendCoins: (userId: string, amount: number) => callAPI("user.spendCoins", userId, { amount }),
  addItem: (userId: string, itemId: string) => callAPI("user.addItem", userId, { itemId }),
  equipItem: (userId: string, itemId: string, graveId: string) => callAPI("user.equipItem", userId, { itemId, graveId }),
  unequipItem: (userId: string, itemId: string) => callAPI("user.unequipItem", userId, { itemId }),
  savePositions: (userId: string, graveId: string, positions: unknown[]) => callAPI("user.savePositions", userId, { graveId, positions }),
}

export const dbCrushes = {
  list: (userId: string) => callAPI("crushes.list", userId),
  save: (userId: string, crush: Record<string, unknown>) => callAPI("crushes.save", userId, { crush }),
  delete: (userId: string, crushId: string) => callAPI("crushes.delete", userId, { crushId }),
}

export const dbAnalysis = {
  list: (userId: string) => callAPI("analysis.list", userId),
  save: (userId: string, record: Record<string, unknown>) => callAPI("analysis.save", userId, { record }),
  delete: (userId: string, recordId: string) => callAPI("analysis.delete", userId, { recordId }),
}

export const dbChat = {
  get: (userId: string, graveId: string) => callAPI("chat.get", userId, { graveId }),
  save: (userId: string, graveId: string, messages: unknown[]) => callAPI("chat.save", userId, { graveId, messages }),
}
