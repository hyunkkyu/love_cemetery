"use client"

import { useState } from "react"

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DateInput({ value, onChange, placeholder = "YYYY-MM-DD", className = "" }: DateInputProps) {
  const [mode, setMode] = useState<"text" | "date">(value ? "date" : "text")

  const baseClass = `w-full px-3 py-2 bg-cemetery-surface border border-cemetery-border rounded-lg
    text-cemetery-text focus:border-cemetery-accent focus:outline-none ${className}`

  const preventSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault()
  }

  if (mode === "text" && !value) {
    return (
      <input
        type="text"
        readOnly
        value=""
        placeholder={placeholder}
        onClick={() => setMode("date")}
        onFocus={() => setMode("date")}
        onKeyDown={preventSubmit}
        className={`${baseClass} cursor-pointer placeholder-cemetery-ghost/40`}
      />
    )
  }

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        if (!e.target.value) setMode("text")
      }}
      onBlur={() => { if (!value) setMode("text") }}
      onKeyDown={preventSubmit}
      autoFocus={mode === "date" && !value}
      style={{ colorScheme: "dark" }}
      className={`${baseClass} ${!value ? "text-cemetery-ghost/40" : ""}`}
    />
  )
}
