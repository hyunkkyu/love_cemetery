"use client"

import { useState, useRef } from "react"
import type { Grave, GraveGrade } from "@/types"
import { GRAVE_GRADES } from "@/types"
import { parseKakaoFile, analyzeChat } from "@/lib/kakao-parser"
import { calculateManseryeok, calculateCompatibility } from "@/lib/manseryeok"
import { DateInput } from "@/components/DateInput"
import { GenderSelect } from "@/components/GenderSelect"

const REASON_OPTIONS = [
  "성격 차이", "가치관 충돌", "소통 부족", "권태기", "장거리",
  "타이밍 안 맞음", "집착/구속", "무관심", "바람/외도", "금전 문제",
  "가족 반대", "미래관 차이", "자존감 하락", "감정 소진", "기타 (직접 입력)",
]

const EPITAPH_OPTIONS = [
  "다시는 이런 사랑 없을 거야", "좋은 추억만 가져갈게",
  "네 덕분에 성장했어", "후회는 없어, 그냥 아플 뿐",
  "사랑했지만 함께할 수 없었어", "잘 가, 행복해",
  "내가 부족했나 봐", "운명이 아니었을 뿐",
  "다음 생에 다시 만나자", "기타 (직접 입력)",
]

const PERSONA_OPTIONS = [
  "다정한", "무뚝뚝한", "유머있는", "츤데레", "4차원",
  "감성적", "이성적", "활발한", "조용한", "리더형",
  "자유로운", "계획적인", "눈치빠른", "둔감한", "기타 (직접 입력)",
]

interface GraveFormProps {
  onSave: (grave: Grave) => void | Promise<void>
  initial?: Partial<Grave>
  initialGrade?: GraveGrade
}

export function GraveForm({ onSave, initial, initialGrade }: GraveFormProps) {
  const [step, setStep] = useState(1)
  const effectiveGrade = initialGrade || (initial?.grade as GraveGrade) || "public"

  const [form, setForm] = useState({
    nickname: initial?.nickname || "",
    grade: effectiveGrade,
    birthDate: initial?.birthDate || "",
    birthTime: initial?.birthTime || "",
    gender: (initial as Record<string, unknown>)?.gender as string || "",
    myBirthDate: initial?.myBirthDate || "",
    myBirthTime: initial?.myBirthTime || "",
    myGender: (initial as Record<string, unknown>)?.myGender as string || "",
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

  // Selection states for chips
  const [selectedReasons, setSelectedReasons] = useState<string[]>(() => {
    if (!initial?.graveReason) return []
    return initial.graveReason.split(", ").filter(Boolean)
  })
  const [reasonCustom, setReasonCustom] = useState("")
  const [selectedEpitaph, setSelectedEpitaph] = useState<string>(() => {
    if (!initial?.epitaph) return ""
    if (EPITAPH_OPTIONS.includes(initial.epitaph)) return initial.epitaph
    return "기타 (직접 입력)"
  })
  const [epitaphCustom, setEpitaphCustom] = useState(() => {
    if (!initial?.epitaph) return ""
    if (EPITAPH_OPTIONS.includes(initial.epitaph)) return ""
    return initial.epitaph
  })
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(() => {
    if (!initial?.persona) return []
    return initial.persona.split(", ").filter(Boolean)
  })
  const [personaCustom, setPersonaCustom] = useState("")

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
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")!
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

  // Chip toggle helpers
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) => {
      const next = prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
      // Update form value
      const values = next.filter((r) => r !== "기타 (직접 입력)")
      if (next.includes("기타 (직접 입력)") && reasonCustom) {
        values.push(reasonCustom)
      }
      setForm((f) => ({ ...f, graveReason: values.join(", ") }))
      return next
    })
  }

  const updateReasonCustom = (value: string) => {
    setReasonCustom(value)
    const values = selectedReasons.filter((r) => r !== "기타 (직접 입력)")
    if (value) values.push(value)
    setForm((f) => ({ ...f, graveReason: values.join(", ") }))
  }

  const selectEpitaph = (epitaph: string) => {
    setSelectedEpitaph(epitaph)
    if (epitaph === "기타 (직접 입력)") {
      setForm((f) => ({ ...f, epitaph: epitaphCustom }))
    } else {
      setForm((f) => ({ ...f, epitaph }))
      setEpitaphCustom("")
    }
  }

  const updateEpitaphCustom = (value: string) => {
    setEpitaphCustom(value)
    setForm((f) => ({ ...f, epitaph: value }))
  }

  const togglePersona = (persona: string) => {
    setSelectedPersonas((prev) => {
      const next = prev.includes(persona)
        ? prev.filter((p) => p !== persona)
        : [...prev, persona]
      const values = next.filter((p) => p !== "기타 (직접 입력)")
      if (next.includes("기타 (직접 입력)") && personaCustom) {
        values.push(personaCustom)
      }
      setForm((f) => ({ ...f, persona: values.join(", ") }))
      return next
    })
  }

  const updatePersonaCustom = (value: string) => {
    setPersonaCustom(value)
    const values = selectedPersonas.filter((p) => p !== "기타 (직접 입력)")
    if (value) values.push(value)
    setForm((f) => ({ ...f, persona: values.join(", ") }))
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

        const senders = Object.keys(chatAnalysis.messagesByPerson)
        const otherPerson = senders.length >= 2
          ? senders.reduce((a, b) =>
              chatAnalysis!.messagesByPerson[a] < chatAnalysis!.messagesByPerson[b] ? a : b
            )
          : senders[0]

        if (otherPerson) {
          chatSamples = messages
            .filter((m) => m.sender === otherPerson && m.message.length > 5 && m.message.length < 200)
            .slice(-200)
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

  const stepLabels = ["기본 정보", "생년월일", "사연 & 카톡"]

  const canNext = step === 1 ? form.nickname.trim() !== "" : true

  return (
    <div className="space-y-6" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
      {/* Progress bar */}
      <div className="space-y-2">
        <p className="text-sm text-cemetery-ghost text-center">
          {step}/3 {stepLabels[step - 1]}
        </p>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-cemetery-accent" : "bg-cemetery-border/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: 기본 정보 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* 선택된 등급 뱃지 */}
          {initialGrade && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${gradeInfo.bg} border border-cemetery-border`}>
              <span>{gradeInfo.emoji}</span>
              <span className={gradeInfo.color}>{gradeInfo.name}</span>
              <span className="text-yellow-400 text-xs">+{gradeInfo.coins}🪙</span>
            </div>
          )}

          {/* 사진 + 닉네임 + 사인 */}
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-cemetery-border
                  hover:border-cemetery-accent bg-cemetery-surface flex items-center justify-center
                  overflow-hidden transition-colors"
              >
                {photo ? (
                  <img src={photo} alt="영정" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="text-2xl text-cemetery-ghost/30">📷</div>
                    <span className="text-xs text-cemetery-ghost/40">영정 사진</span>
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
                  className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
                    text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-cemetery-ghost mb-1">사인 (선택)</label>
                <select
                  value={form.causeOfDeath}
                  onChange={(e) => update("causeOfDeath", e.target.value)}
                  className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
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

          {/* 묘지 등급 선택 - only if no initialGrade */}
          {!initialGrade && (
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
                      <div className="text-xs text-cemetery-ghost/50 mt-1">{info.description}</div>
                      <div className="text-xs text-yellow-400 mt-2">🪙 +{info.coins}/묘비</div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: 생년월일 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="space-y-2 border border-cemetery-border/50 rounded-xl p-4">
              <legend className="text-sm text-cemetery-ghost px-2">상대방 생년월일시 (선택)</legend>
              <GenderSelect value={form.gender} onChange={(v) => update("gender", v)} />
              <DateInput
                value={form.birthDate}
                onChange={(v) => update("birthDate", v)}
                placeholder="생년월일 선택"
              />
              <select
                value={form.birthTime}
                onChange={(e) => update("birthTime", e.target.value)}
                className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
                  text-cemetery-text focus:border-cemetery-accent focus:outline-none"
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </fieldset>
            <fieldset className="space-y-2 border border-cemetery-border/50 rounded-xl p-4">
              <legend className="text-sm text-cemetery-ghost px-2">나의 생년월일시 (선택)</legend>
              <GenderSelect value={form.myGender} onChange={(v) => update("myGender", v)} />
              <DateInput
                value={form.myBirthDate}
                onChange={(v) => update("myBirthDate", v)}
                placeholder="생년월일 선택"
              />
              <select
                value={form.myBirthTime}
                onChange={(e) => update("myBirthTime", e.target.value)}
                className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
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
              <label className="block text-sm text-cemetery-ghost mb-1">교제 시작일 (선택)</label>
              <DateInput
                value={form.relationshipStart}
                onChange={(v) => update("relationshipStart", v)}
                placeholder="교제 시작일 선택"
              />
            </div>
            <div>
              <label className="block text-sm text-cemetery-ghost mb-1">사망일 (이별일) (선택)</label>
              <DateInput
                value={form.relationshipEnd}
                onChange={(v) => update("relationshipEnd", v)}
                placeholder="이별일 선택"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: 사연 & 카톡 */}
      {step === 3 && (
        <div className="space-y-6">
          <p className="text-xs text-cemetery-ghost/60 text-center">
            선택사항은 나중에 수정할 수 있어요
          </p>

          {/* 이별 사유 - multi-select chips */}
          <div>
            <label className="block text-sm text-cemetery-ghost mb-2">📝 이별 사유 (선택, 복수 선택 가능)</label>
            <div className="flex flex-wrap gap-2">
              {REASON_OPTIONS.map((option) => {
                const isCustom = option === "기타 (직접 입력)"
                const isSelected = selectedReasons.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleReason(option)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      isSelected
                        ? isCustom
                          ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                          : "bg-cemetery-accent text-white"
                        : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-ghost/30"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedReasons.includes("기타 (직접 입력)") && (
              <input
                type="text"
                value={reasonCustom}
                onChange={(e) => updateReasonCustom(e.target.value)}
                placeholder="직접 입력..."
                className="mt-2 w-full px-3 py-2 bg-cemetery-surface border border-yellow-500/30 rounded-xl
                  text-cemetery-text placeholder-cemetery-ghost/40 focus:border-yellow-400 focus:outline-none text-sm"
              />
            )}
          </div>

          {/* 비문 - single select */}
          <div>
            <label className="block text-sm text-cemetery-ghost mb-2">🪦 비문 (선택)</label>
            <div className="flex flex-wrap gap-2">
              {EPITAPH_OPTIONS.map((option) => {
                const isCustom = option === "기타 (직접 입력)"
                const isSelected = selectedEpitaph === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectEpitaph(option)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      isSelected
                        ? isCustom
                          ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                          : "bg-cemetery-accent text-white"
                        : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-ghost/30"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedEpitaph === "기타 (직접 입력)" && (
              <input
                type="text"
                value={epitaphCustom}
                onChange={(e) => updateEpitaphCustom(e.target.value)}
                placeholder="묘비에 새길 한 마디..."
                className="mt-2 w-full px-3 py-2 bg-cemetery-surface border border-yellow-500/30 rounded-xl
                  text-cemetery-text placeholder-cemetery-ghost/40 focus:border-yellow-400 focus:outline-none text-sm"
              />
            )}
          </div>

          {/* 성격/말투 - multi-select chips */}
          <div>
            <label className="block text-sm text-cemetery-ghost mb-2">👻 상대의 성격/말투 (선택, 복수 선택 가능)</label>
            <div className="flex flex-wrap gap-2">
              {PERSONA_OPTIONS.map((option) => {
                const isCustom = option === "기타 (직접 입력)"
                const isSelected = selectedPersonas.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => togglePersona(option)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      isSelected
                        ? isCustom
                          ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                          : "bg-cemetery-accent text-white"
                        : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-ghost/30"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedPersonas.includes("기타 (직접 입력)") && (
              <input
                type="text"
                value={personaCustom}
                onChange={(e) => updatePersonaCustom(e.target.value)}
                placeholder="직접 입력..."
                className="mt-2 w-full px-3 py-2 bg-cemetery-surface border border-yellow-500/30 rounded-xl
                  text-cemetery-text placeholder-cemetery-ghost/40 focus:border-yellow-400 focus:outline-none text-sm"
              />
            )}
            <p className="text-xs text-cemetery-ghost/40 mt-1">
              상대의 말투와 성격을 선택할수록 AI 대화가 더 자연스러워져요
            </p>
          </div>

          {/* 카카오톡 파일 */}
          <div>
            <label className="block text-sm text-cemetery-ghost mb-1">💬 카카오톡 대화 파일 (선택)</label>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={(e) => setChatFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-xl
                text-cemetery-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0
                file:bg-cemetery-accent file:text-white file:cursor-pointer"
            />
            <p className="text-xs text-cemetery-ghost/40 mt-1">
              카카오톡 &gt; 채팅방 &gt; 설정 &gt; 대화 내보내기로 저장한 .txt 파일
              {chatFile && " • 업로드하면 상대와의 AI 대화도 가능해요!"}
            </p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-3 text-cemetery-ghost hover:text-cemetery-text
              rounded-xl font-semibold transition-colors"
          >
            이전
          </button>
        )}
        <div className="flex-1" />
        {step < 3 && (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
              rounded-xl font-semibold transition-colors cute-press"
          >
            다음
          </button>
        )}
        {step === 3 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={processing || !form.nickname}
            className="flex-1 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
              rounded-xl font-semibold transition-colors cute-press"
          >
            {processing ? "분석 중..." : `${gradeInfo.emoji} ${gradeInfo.name}에 묻기 (🪙 +${gradeInfo.coins})`}
          </button>
        )}
      </div>
    </div>
  )
}
