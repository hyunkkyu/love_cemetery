"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { dbGraves, dbUser, dbCrushes, dbAnalysis, dbChat } from "@/lib/api-client"

export function useUserId() {
  const { data: session } = useSession()
  return (session?.user as { id?: string })?.id
}

/** 묘비 목록 훅 */
export function useGraves() {
  const userId = useUserId()
  const [graves, setGraves] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await dbGraves.list(userId)
      setGraves(data || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { reload() }, [reload])

  return { graves, loading, reload, userId }
}

/** 유저 데이터 (코인, 아이템) 훅 */
export function useUserData() {
  const userId = useUserId()
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const data = await dbUser.get(userId)
      setUserData(data)
    } catch { /* ignore */ }
  }, [userId])

  useEffect(() => { reload() }, [reload])

  return { userData, reload, userId }
}

/** 썸 목록 훅 */
export function useCrushes() {
  const userId = useUserId()
  const [crushes, setCrushes] = useState<Record<string, unknown>[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const data = await dbCrushes.list(userId)
      setCrushes(data || [])
    } catch { /* ignore */ }
  }, [userId])

  useEffect(() => { reload() }, [reload])

  return { crushes, reload, userId }
}

/** 분석 기록 훅 */
export function useAnalysisRecords() {
  const userId = useUserId()
  const [records, setRecords] = useState<Record<string, unknown>[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const data = await dbAnalysis.list(userId)
      setRecords(data || [])
    } catch { /* ignore */ }
  }, [userId])

  useEffect(() => { reload() }, [reload])

  return { records, reload, userId }
}
