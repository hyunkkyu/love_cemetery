"use client"

import { useState, useEffect } from "react"

const SIZES = [
  { label: "가", value: 13, name: "작게" },
  { label: "가", value: 15, name: "보통" },
  { label: "가", value: 17, name: "크게" },
  { label: "가", value: 19, name: "아주 크게" },
]

export function FontSizeControl() {
  const [size, setSize] = useState(15)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("font-size")
    if (saved) {
      const s = parseInt(saved)
      setSize(s)
      document.documentElement.style.fontSize = s + "px"
    }
  }, [])

  const handleChange = (newSize: number) => {
    setSize(newSize)
    localStorage.setItem("font-size", String(newSize))
    document.documentElement.style.fontSize = newSize + "px"
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-6 z-40 w-10 h-10 rounded-full bg-cemetery-card border border-cemetery-border
          shadow-lg flex items-center justify-center text-sm text-cemetery-ghost
          hover:border-cemetery-accent transition-colors"
        title="글씨 크기"
      >
        가
      </button>

      {open && (
        <div className="fixed bottom-32 right-6 z-40 bg-cemetery-card border border-cemetery-border
          rounded-2xl shadow-xl p-3 space-y-1 animate-fade-in w-32">
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleChange(s.value)}
              className={"w-full px-3 py-2 rounded-xl text-left transition-colors flex items-center justify-between " +
                (size === s.value
                  ? "bg-cemetery-accent/20 text-cemetery-accent"
                  : "text-cemetery-ghost hover:bg-cemetery-surface")}
            >
              <span style={{ fontSize: s.value + "px" }}>{s.label}</span>
              <span className="text-[10px]">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
