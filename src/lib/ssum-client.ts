async function callSsum(action: string, payload: Record<string, unknown> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch("/api/ssum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    })
    const text = await res.text()
    if (!text) throw new Error("서버 응답이 비어있습니다")
    const json = JSON.parse(text)
    if (!res.ok || json.error) throw new Error(json.error || "API 오류")
    return json
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("요청 시간 초과")
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const dbSsum = {
  list: () => callSsum("ssum.list"),
  get: (ssumId: string) => callSsum("ssum.get", { ssumId }),
  save: (ssum: Record<string, unknown>) => callSsum("ssum.save", { ssum }),
  delete: (ssumId: string) => callSsum("ssum.delete", { ssumId }),
  analyze: (ssumId: string) => callSsum("ssum.analyze", { ssumId }),
}
