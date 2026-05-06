"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"summon" | "ritual" | "reborn">("summon")
  const [nickname, setNickname] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [ghostPhase, setGhostPhase] = useState(0)

  const handleSummon = async () => {
    if (!nickname.trim()) return
    setError("")
    setLoading(true)

    // 유령 소환 애니메이션
    setGhostPhase(1)
    await new Promise((r) => setTimeout(r, 1500))
    setGhostPhase(2)
    await new Promise((r) => setTimeout(r, 1000))

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.getQuestion", nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setError("이 이름의 유령을 찾을 수 없습니다...")
        setGhostPhase(0)
        setLoading(false)
        return
      }
      setQuestion(data.data.question)
      setGhostPhase(3)
      await new Promise((r) => setTimeout(r, 800))
      setStep("ritual")
    } catch {
      setError("소환 중 문제가 발생했습니다")
      setGhostPhase(0)
    }
    setLoading(false)
  }

  const handleRitual = async () => {
    setError("")
    if (!answer.trim()) { setError("영혼의 답을 속삭여주세요"); return }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("새로운 주문: 8자 이상, 영문+숫자 포함"); return
    }
    if (newPassword !== newPasswordConfirm) { setError("주문이 일치하지 않습니다"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgotPassword.verify", nickname, answer: answer.trim(), newPassword }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setStep("reborn")
    } catch {
      setError("의식 중 문제가 발생했습니다")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* 소환 단계 */}
        {step === "summon" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className={"text-6xl inline-block transition-all duration-1000 " +
                (ghostPhase === 0 ? "opacity-30" :
                 ghostPhase === 1 ? "opacity-60 animate-bounce" :
                 ghostPhase === 2 ? "opacity-90 ghost-float" : "opacity-100 scale-110")}>
                {ghostPhase === 0 ? "⚰️" : ghostPhase === 1 ? "💀" : ghostPhase === 2 ? "👻" : "✨"}
              </div>
              <h1 className="font-gothic text-2xl font-black text-cemetery-heading">
                {ghostPhase === 0 ? "영혼 소환" :
                 ghostPhase === 1 ? "무덤을 파고 있어요..." :
                 ghostPhase === 2 ? "유령을 깨우는 중..." : "유령을 찾았어요!"}
              </h1>
              <p className="text-xs text-cemetery-ghost/50">
                {ghostPhase === 0 ? "잃어버린 기억의 주인을 소환합니다" : "잠시만 기다려주세요..."}
              </p>
            </div>

            {ghostPhase === 0 && (
              <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
                <div>
                  <label className="block text-xs text-cemetery-ghost/50 mb-1">유령의 이름 (닉네임)</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                    placeholder="소환할 영혼의 이름을 대세요"
                    className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
                </div>
                {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
                <button type="button" onClick={handleSummon} disabled={loading || !nickname.trim()}
                  className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
                  ⚰️ 영혼 소환하기
                </button>
              </div>
            )}

            {ghostPhase > 0 && ghostPhase < 3 && (
              <div className="text-center py-4">
                <div className="flex justify-center gap-2">
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2.5 h-2.5 bg-cemetery-accent rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 의식 단계 */}
        {step === "ritual" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="text-5xl ghost-float inline-block">👻</div>
              <h1 className="font-gothic text-2xl font-black text-cemetery-heading">기억의 의식</h1>
              <p className="text-xs text-cemetery-ghost/50">
                유령이 당신에게 질문합니다<br />올바른 답을 속삭이면 기억이 돌아옵니다
              </p>
            </div>

            {/* 유령의 질문 - 말풍선 */}
            <div className="bg-cemetery-card border border-cemetery-accent/30 rounded-2xl p-4 relative">
              <div className="absolute -top-3 left-6 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-transparent border-b-cemetery-card" />
              <p className="text-[10px] text-cemetery-accent mb-1">👻 유령이 속삭입니다...</p>
              <p className="text-sm text-cemetery-heading italic">&ldquo;{question}&rdquo;</p>
            </div>

            <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}>
              <div>
                <label className="block text-xs text-cemetery-ghost/50 mb-1">🕯️ 영혼의 답</label>
                <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder="유령에게 답을 속삭이세요..."
                  className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
              </div>

              <div className="border-t border-cemetery-border/30 pt-4">
                <p className="text-xs text-cemetery-ghost/50 mb-3">🔮 새로운 주문 (비밀번호) 설정</p>
                <div className="space-y-3">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 주문 (8자+, 영문+숫자)"
                    className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
                  <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="주문 확인"
                    className="w-full px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-xl text-cemetery-text placeholder-cemetery-ghost/30 focus:border-cemetery-accent focus:outline-none" />
                </div>
              </div>

              {error && <p className="text-xs text-red-400">⚠️ {error}</p>}

              <button type="button" onClick={handleRitual} disabled={loading}
                className="w-full py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-40 rounded-xl font-semibold transition-colors cute-press">
                {loading ? "의식 진행 중..." : "🔮 기억의 의식 완료"}
              </button>
            </div>
          </div>
        )}

        {/* 부활 완료 */}
        {step === "reborn" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl ghost-float inline-block">🎉</div>
            <div>
              <h1 className="font-gothic text-2xl font-black text-cemetery-heading">부활 성공!</h1>
              <p className="text-sm text-cemetery-ghost mt-2">
                영혼이 새로운 주문을 기억했습니다.<br />
                이제 다시 묘지에 입장할 수 있어요.
              </p>
            </div>
            <button onClick={() => router.push("/login")}
              className="w-full py-3 bg-cemetery-accent rounded-xl font-semibold transition-colors cute-press text-lg">
              🚪 다시 입장하기
            </button>
          </div>
        )}

        <p className="text-center text-xs text-cemetery-ghost/30">
          <a href="/login" className="hover:text-cemetery-accent transition-colors">← 로그인으로</a>
        </p>
      </div>
    </div>
  )
}
