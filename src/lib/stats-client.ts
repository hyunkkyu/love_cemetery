async function callStats(action: string) {
  const res = await fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) throw new Error(`Stats API error: ${res.status}`)
  const json = await res.json()
  return json.data
}

export const dbStats = {
  overview: () => callStats("overview"),
  ranking: () => callStats("ranking"),
  myPosition: () => callStats("myPosition"),
  mbtiStats: () => callStats("mbtiStats"),
  iljuStats: () => callStats("iljuStats"),
  myGroup: () => callStats("myGroup"),
  daily: () => callStats("daily"),
}
