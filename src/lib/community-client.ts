async function callAPI(action: string, _userId: string | undefined, payload: Record<string, unknown> = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch("/api/community", {
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
    if (error instanceof Error && error.name === "AbortError") throw new Error("요청 시간이 초과되었습니다")
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const dbPosts = {
  list: (category?: string, sort?: string, page?: number) =>
    callAPI("posts.list", undefined, { category, sort, page }),
  get: (postId: string) => callAPI("posts.get", undefined, { postId }),
  create: (userId: string, data: Record<string, unknown>) =>
    callAPI("posts.create", userId, data),
  delete: (userId: string, postId: string) =>
    callAPI("posts.delete", userId, { postId }),
  like: (userId: string, postId: string) =>
    callAPI("posts.like", userId, { postId }),
}

export const dbComments = {
  list: (postId: string) => callAPI("comments.list", undefined, { postId }),
  create: (userId: string, data: Record<string, unknown>) =>
    callAPI("comments.create", userId, data),
  delete: (userId: string, commentId: string) =>
    callAPI("comments.delete", userId, { commentId }),
  like: (userId: string, commentId: string) =>
    callAPI("comments.like", userId, { commentId }),
}

export const dbSajuProfile = {
  get: (userId: string) => callAPI("saju.getProfile", userId),
  register: (userId: string, nickname: string, profile: Record<string, unknown>) =>
    callAPI("saju.register", userId, { nickname, profile }),
  findMatches: (userId: string) => callAPI("saju.findMatches", userId),
}
