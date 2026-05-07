// 간단한 인메모리 레이트 리미터 (userId 기반)
// Vercel 서버리스에서는 인스턴스별이라 완벽하지 않지만, 기본 보호 제공

const requests: Map<string, { count: number; resetAt: number }> = new Map()

// 1분 간격으로 오래된 항목 정리
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of requests) {
    if (val.resetAt < now) requests.delete(key)
  }
}, 60000)

/**
 * 레이트 리미트 체크
 * @returns true면 허용, false면 차단
 */
export function checkRateLimit(userId: string, limit: number = 10, windowMs: number = 60000): boolean {
  const key = userId
  const now = Date.now()
  const record = requests.get(key)

  if (!record || record.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
