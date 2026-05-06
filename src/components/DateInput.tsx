"use client"

import { useState, useRef } from "react"

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DateInput({ value, onChange, placeholder = "예: 1995-03-15", className = "" }: DateInputProps) {
  const [textMode, setTextMode] = useState(!value)
  const [textValue, setTextValue] = useState(value || "")
  const dateRef = useRef<HTMLInputElement>(null)

  const baseClass = "w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text focus:border-cemetery-accent focus:outline-none " + className

  const preventSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault()
  }

  // 텍스트 입력 → 유효한 날짜면 반영
  const handleTextChange = (val: string) => {
    // 숫자와 하이픈만 허용, 자동 하이픈 삽입
    let cleaned = val.replace(/[^\d-]/g, "")

    // 자동 하이픈: 4자리 후, 7자리 후
    if (cleaned.length === 4 && !cleaned.includes("-")) cleaned += "-"
    if (cleaned.length === 7 && cleaned.split("-").length === 2) cleaned += "-"
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10)

    setTextValue(cleaned)

    // YYYY-MM-DD 형식 완성 시
    const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      const y = parseInt(match[1])
      const m = parseInt(match[2])
      const d = parseInt(match[3])
      if (y >= 1920 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        onChange(cleaned)
      }
    }
  }

  // date picker에서 선택 시
  const handleDateChange = (val: string) => {
    onChange(val)
    setTextValue(val)
    setTextMode(true)
  }

  return (
    <div className="relative flex gap-2">
      {/* 텍스트 입력 (메인) */}
      <input
        type="text"
        inputMode="numeric"
        value={textValue}
        onChange={(e) => handleTextChange(e.target.value)}
        onKeyDown={preventSubmit}
        placeholder={placeholder}
        className={baseClass + " flex-1 placeholder-cemetery-ghost/40"}
      />

      {/* 달력 버튼 (보조) */}
      <button
        type="button"
        onClick={() => dateRef.current?.showPicker?.()}
        className="px-3 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-ghost hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex-shrink-0"
      >
        📅
      </button>

      {/* 숨겨진 date input */}
      <input
        ref={dateRef}
        type="date"
        value={value}
        onChange={(e) => handleDateChange(e.target.value)}
        onKeyDown={preventSubmit}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        style={{ colorScheme: "dark" }}
        tabIndex={-1}
      />
    </div>
  )
}
