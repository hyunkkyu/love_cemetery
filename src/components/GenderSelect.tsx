"use client"

interface GenderSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function GenderSelect({ value, onChange, className = "" }: GenderSelectProps) {
  return (
    <div className={"flex gap-2 " + className}>
      <button type="button" onClick={() => onChange("M")}
        className={"flex-1 py-2 rounded-lg text-sm transition-all " +
          (value === "M" ? "bg-blue-500/20 border border-blue-500/40 text-blue-300" : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-ghost/40")}>
        ♂ 남
      </button>
      <button type="button" onClick={() => onChange("F")}
        className={"flex-1 py-2 rounded-lg text-sm transition-all " +
          (value === "F" ? "bg-pink-500/20 border border-pink-500/40 text-pink-300" : "bg-cemetery-surface border border-cemetery-border text-cemetery-ghost hover:border-cemetery-ghost/40")}>
        ♀ 여
      </button>
    </div>
  )
}
