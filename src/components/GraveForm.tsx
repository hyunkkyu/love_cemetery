"use client"

import { useState, useRef } from "react"
import type { Grave, GraveGrade } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { parseKakaoFile, analyzeChat } from "@/lib/kakao-parser"
import { calculateManseryeok, calculateCompatibility } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"

interface GraveFormProps {
  onSave: (grave: Grave) => void | Promise<void>
  initial?: Partial<Grave>
}

export function GraveForm({ onSave, initial }: GraveFormProps) {
  const [form, setForm] = useState({
    nickname: initial?.nickname || "",
    grade: (initial?.grade || "public") as GraveGrade,
    birthDate: initial?.birthDate || "",
    birthTime: initial?.birthTime || "",
    myBirthDate: initial?.myBirthDate || "",
    myBirthTime: initial?.myBirthTime || "",
    relationshipStart: initial?.relationshipStart || "",
    relationshipEnd: initial?.relationshipEnd || "",
    causeOfDeath: initial?.causeOfDeath || "",
    graveReason: initial?.graveReason || "",
    epitaph: initial?.epitaph || "",
    persona: initial?.persona || "",
  })
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo)
  const [chatFile, setChatFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const hourOptions = [
    { value: "", label: "모름 (정오로 계산)" },
    { value: "0", label: "자시 (23:30~01:30)" },
    { value: "2", label: "축시 (01:30~03:30)" },
    { value: "4", label: "인시 (03:30~05:30)" },
    { value: "6", label: "묘시 (05:30~07:30)" },
    { value: "8", label: "진시 (07:30~09:30)" },
    { value: "10", label: "사시 (09:30~11:30)" },
    { value: "12", label: "오시 (11:30~13:30)" },
    { value: "14", label: "미시 (13:30~15:30)" },
    { value: "16", label: "신시 (15:30~17:30)" },
    { value: "18", label: "유시 (17:30~19:30)" },
    { value: "20", label: "술시 (19:30~21:30)" },
    { value: "22", label: "해시 (21:30~23:30)" },
  ]

  const causeOptions = [
    "자연사 (자연스럽게 식음)",
    "사고사 (갑작스러운 이별)",
    "타살 (바람/외도)",
    "과로사 (지침)",
    "동사 (차가워짐)",
    "질식사 (집착/구속)",
    "아사 (관심 부족)",
    "기타",
  ]

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 이미지 리사이즈 후 base64
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")!
        // 정사각형 크롭
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        setPhoto(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (processing || !form.nickname) return
    setProcessing(true)

    try {
      let chatAnalysis = undefined
      let chatSamples: string[] | undefined = undefined

      if (chatFile) {
        const text = await chatFile.text()
        const messages = parseKakaoFile(text, chatFile.name)
        chatAnalysis = analyzeChat(messages)

        // 상대방 메시지 샘플 추출 (AI 채팅용)
        const senders = Object.keys(chatAnalysis.messagesByPerson)
        // 가장 많이 보낸 사람이 아닌 쪽을 상대로 추정 (본인이 더 많이 보냈을 가능성)
        const otherPerson = senders.length >= 2
          ? senders.reduce((a, b) =>
              chatAnalysis!.messagesByPerson[a] < chatAnalysis!.messagesByPerson[b] ? a : b
            )
          : senders[0]

        if (otherPerson) {
          chatSamples = messages
            .filter((m) => m.sender === otherPerson && m.message.length > 5 && m.message.length < 200)
            .slice(-200) // 최근 200개
            .map((m) => m.message)
        }
      }

      let manseryeok = undefined
      let myManseryeok = undefined
      let compatibility = undefined

      if (form.birthDate) {
        const [y, m, d] = form.birthDate.split("-").map(Number)
        const hour = form.birthTime ? parseInt(form.birthTime) : 12
        manseryeok = calculateManseryeok(y, m, d, hour)
      }

      if (form.myBirthDate) {
        const [y, m, d] = form.myBirthDate.split("-").map(Number)
        const hour = form.myBirthTime ? parseInt(form.myBirthTime) : 12
        myManseryeok = calculateManseryeok(y, m, d, hour)
      }

      if (manseryeok && myManseryeok) {
        const compat = calculateCompatibility(myManseryeok, manseryeok)
        compatibility = {
          ...compat,
          elementHarmony: `${myManseryeok.dominantElement} ↔ ${manseryeok.dominantElement}`,
        }
      }

      const grave: Grave = {
        id: initial?.id || Math.random().toString(36).slice(2) + Date.now().toString(36),
        ...form,
        photo,
        chatAnalysis,
        chatSamples,
        manseryeok,
        myManseryeok,
        compatibility,
        createdAt: initial?.createdAt || new Date().toISOString(),
      }

      try {
        await onSave(grave)
      } catch (saveErr) {
        alert(saveErr instanceof Error ? saveErr.message : "서버 저장 중 오류가 발생했습니다.")
      }
    } catch (err) {
      alert(err instanceof Error ? `오류: ${err.message}` : "등록 중 오류가 발생했습니다.")
    } finally {
      setProcessing(false)
    }
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const gradeInfo = GRAVE_GRADES[form.grade]

  return (
    <div className="space-y-6" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
      {/* 사진 + 닉네임 */}
      <div className="flex gap-6 items-start">
        {/* 영정 사진 */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-cemetery-border
              hover:border-cemetery-accent bg-cemetery-surface flex items-center justify-center
              overflow-hidden transition-colors"
          >
            {photo ? (
              <img src={photo} alt="영정" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-2xl text-cemetery-ghost/30">📷</div>
                <span className="text-[10px] text-cemetery-ghost/40">영정 사진</span>
              </div>
            )}
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">상대 닉네임 *</label>
            <input
              type="text"
              required
              value={form.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              placeholder="묘비에 새길 이름"
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">사인</label>
            <select
              value={form.causeOfDeath}
              onChange={(e) => update("causeOfDeath", e.target.value)}
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
                text-cemetery-text focus:border-cemetery-accent focus:outline-none"
            >
              <option value="">선택...</option>
              {causeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 묘지 등급 선택 */}
      <div>
        <label className="block text-sm text-cemetery-ghost mb-2">묘지 등급 선택 *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(GRAVE_GRADES) as [GraveGrade, typeof gradeInfo][]).map(
            ([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, grade: key }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.grade === key
                    ? `border-cemetery-accent ${info.bg} ring-1 ring-cemetery-accent`
                    : "border-cemetery-border bg-cemetery-surface hover:border-cemetery-ghost/30"
                }`}
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className={`text-sm font-semibold ${info.color}`}>{info.name}</div>
                <div className="text-[10px] text-cemetery-ghost/50 mt-1">{info.description}</div>
                <div className="text-xs text-yellow-400 mt-2">🪙 +{info.coins}/묘비</div>
              </button>
            )
          )}
        </div>
      </div>

      {/* 생년월일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset className="space-y-2 border border-cemetery-border/50 rounded-lg p-4">
          <legend className="text-sm text-cemetery-ghost px-2">상대방 생년월일시</legend>
          <DateInput
            value={form.birthDate}
            onChange={(v) => update("birthDate", v)}
            placeholder="생년월일 선택"
          />
          <select
            value={form.birthTime}
            onChange={(e) => update("birthTime", e.target.value)}
            className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
              text-cemetery-text focus:border-cemetery-accent focus:outline-none"
          >
            {hourOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </fieldset>
        <fieldset className="space-y-2 border border-cemetery-border/50 rounded-lg p-4">
          <legend className="text-sm text-cemetery-ghost px-2">나의 생년월일시</legend>
          <DateInput
            value={form.myBirthDate}
            onChange={(v) => update("myBirthDate", v)}
            placeholder="생년월일 선택"
          />
          <select
            value={form.myBirthTime}
            onChange={(e) => update("myBirthTime", e.target.value)}
            className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
              text-cemetery-text focus:border-cemetery-accent focus:outline-none"
          >
            {hourOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </fieldset>
      </div>

      {/* 교제 기간 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-cemetery-ghost mb-1">교제 시작일</label>
          <DateInput
            value={form.relationshipStart}
            onChange={(v) => update("relationshipStart", v)}
            placeholder="교제 시작일 선택"
          />
        </div>
        <div>
          <label className="block text-sm text-cemetery-ghost mb-1">사망일 (이별일)</label>
          <DateInput
            value={form.relationshipEnd}
            onChange={(v) => update("relationshipEnd", v)}
            placeholder="이별일 선택"
          />
        </div>
      </div>

      {/* 이 묘지에 묻힌 사연 */}
      <div>
        <label className="block text-sm text-cemetery-ghost mb-1">📝 이 묘지에 묻힌 이유</label>
        <textarea
          value={form.graveReason}
          onChange={(e) => update("graveReason", e.target.value)}
          placeholder="이 사람과의 연애가 여기 묻히게 된 사연을 적어주세요. 만남부터 이별까지, 좋았던 점, 힘들었던 점, 배운 점 등... 자세히 적을수록 AI 분석이 정확해져요."
          rows={4}
          className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
            text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none resize-none"
        />
      </div>

      {/* 비문 */}
      <div>
        <label className="block text-sm text-cemetery-ghost mb-1">비문 (묘비에 새길 한 마디)</label>
        <textarea
          value={form.epitaph}
          onChange={(e) => update("epitaph", e.target.value)}
          placeholder="잊지 못할 한 마디를 남겨주세요..."
          rows={2}
          className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
            text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none resize-none"
        />
      </div>

      {/* 페르소나 (AI 대화용) */}
      <div>
        <label className="block text-sm text-cemetery-ghost mb-1">👻 상대의 성격/말투 (AI 대화에 반영)</label>
        <textarea
          value={form.persona}
          onChange={(e) => update("persona", e.target.value)}
          placeholder="예: ISTJ, 무뚝뚝하지만 가끔 애교부림, 반말 위주, 'ㅋㅋ' 대신 'ㅎㅎ' 사용, 이모티콘 잘 안 씀, 가끔 츤데레..."
          rows={3}
          className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
            text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none resize-none"
        />
        <p className="text-xs text-cemetery-ghost/40 mt-1">
          상대의 말투와 성격을 자세히 적을수록 AI 대화가 더 자연스러워져요
        </p>
      </div>

      {/* 카카오톡 파일 */}
      <div>
        <label className="block text-sm text-cemetery-ghost mb-1">💬 카카오톡 대화 파일</label>
        <input
          type="file"
          accept=".txt,.csv"
          onChange={(e) => setChatFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
            text-cemetery-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0
            file:bg-cemetery-accent file:text-white file:cursor-pointer"
        />
        <p className="text-xs text-cemetery-ghost/40 mt-1">
          카카오톡 &gt; 채팅방 &gt; 설정 &gt; 대화 내보내기로 저장한 .txt 파일
          {chatFile && " • 업로드하면 상대와의 AI 대화도 가능해요!"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={processing || !form.nickname}
        className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
          rounded-lg font-semibold transition-colors cute-press"
      >
        {processing ? "분석 중..." : `${gradeInfo.emoji} ${gradeInfo.name}에 묻기 (🪙 +${gradeInfo.coins})`}
      </button>
    </div>
  )
}
