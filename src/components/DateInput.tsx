"use client"

import { useState, useEffect, useRef } from "react"

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DateInput({ value, onChange, placeholder = "YYYYMMDD (예: 19950315)", className = "" }: DateInputProps) {
  const [text, setText] = useState("")
  const dateRef = useRef<HTMLInputElement>(null)

  const baseClass = "w-full px-3 py-2.5 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-text focus:border-cemetery-accent focus:outline-none " + className

  // 외부 value 변경 시 텍스트 동기화
  useEffect(() => {
    if (value && value !== formatToDate(text)) {
      setText(value.replace(/-/g, ""))
    }
  }, [value])

  // 숫자 8자리 → YYYY-MM-DD 변환
  function formatToDate(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    if (digits.length === 8) {
      return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6, 8)
    }
    return ""
  }

  // 표시용 포맷 (입력 중)
  function formatDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 4) return digits
    if (digits.length <= 6) return digits.slice(0, 4) + "-" + digits.slice(4)
    return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6)
  }

  const handleChange = (val: string) => {
    // 숫자만 추출
    const digits = val.replace(/\D/g, "").slice(0, 8)
    setText(digits)

    // 8자리 완성 시 유효성 검증 + 반영
    if (digits.length === 8) {
      const y = parseInt(digits.slice(0, 4))
      const m = parseInt(digits.slice(4, 6))
      const d = parseInt(digits.slice(6, 8))
      if (y >= 1920 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        onChange(formatToDate(digits))
      }
    }
  }

  // 달력에서 선택 시
  const handleDatePick = (val: string) => {
    onChange(val)
    setText(val.replace(/-/g, ""))
  }

  // 📅 버튼 클릭 (Safari 호환)
  const openPicker = () => {
    const el = dateRef.current
    if (!el) return
    if (typeof el.showPicker === "function") {
      try { el.showPicker() } catch { el.focus(); el.click() }
    } else {
      el.focus()
      el.click()
    }
  }

  return (
    <div className="relative flex gap-2">
      {/* 키보드 입력 (메인) */}
      <input
        type="text"
        inputMode="numeric"
        value={formatDisplay(text)}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
        placeholder={placeholder}
        maxLength={10}
        className={baseClass + " flex-1 placeholder-cemetery-ghost/40"}
      />

      {/* 달력 버튼 */}
      <button
        type="button"
        onClick={openPicker}
        className="px-3 bg-cemetery-surface border border-cemetery-border rounded-lg text-cemetery-ghost hover:text-cemetery-heading hover:border-cemetery-accent transition-colors flex-shrink-0"
      >
        📅
      </button>

      {/* 숨겨진 date picker */}
      <input
        ref={dateRef}
        type="date"
        value={value}
        onChange={(e) => handleDatePick(e.target.value)}
        className="absolute opacity-0 w-0 h-0"
        style={{ colorScheme: "dark", pointerEvents: "none" }}
        tabIndex={-1}
      />
    </div>
  )
}
