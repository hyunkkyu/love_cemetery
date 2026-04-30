async function callPartner(action: string, payload: Record<string, unknown> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    })
    const text = await res.text()
    if (!text) throw new Error("서버 응답이 비어있습니다")
    const json = JSON.parse(text)
    if (!res.ok || json.error) throw new Error(json.error || "API 오류: " + res.status)
    return json
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("요청 시간 초과")
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const dbPartner = {
  userList: () => callPartner("partner.userList"),
  request: (toUserId: string, toNickname: string) => callPartner("partner.request", { toUserId, toNickname }),
  received: () => callPartner("partner.received"),
  accept: (requestId: string) => callPartner("partner.accept", { requestId }),
  reject: (requestId: string) => callPartner("partner.reject", { requestId }),
  list: () => callPartner("partner.list"),
  remove: (partnerId: string) => callPartner("partner.remove", { partnerId }),
  graves: (partnerId: string) => callPartner("partner.graves", { partnerId }),
  graveDetail: (partnerId: string, graveId: string) => callPartner("partner.graveDetail", { partnerId, graveId }),
  pendingCount: () => callPartner("partner.pendingCount"),
}

export const dbGraveComment = {
  list: (graveId: string) => callPartner("comment.list", { graveId }),
  create: (graveId: string, graveOwnerId: string, content: string) =>
    callPartner("comment.create", { graveId, graveOwnerId, content }),
  delete: (commentId: string) => callPartner("comment.delete", { commentId }),
}
