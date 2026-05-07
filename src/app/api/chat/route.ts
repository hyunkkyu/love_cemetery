import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"
import { auth } from "@/lib/auth"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const uid = (session?.user as { id?: string })?.id
    if (!uid) return NextResponse.json({ reply: "⚠️ 로그인이 필요한 기능입니다." }, { status: 401 })
    const { checkRateLimit } = await import("@/lib/rate-limit")
    if (!checkRateLimit(uid, 10, 60000)) return NextResponse.json({ reply: "⚠️ 너무 많은 요청입니다. 1분 후 다시 시도해주세요." }, { status: 429 })
    const { message, nickname, myName, persona, chatSamples, chatHistory } = await request.json()

    if (!message || !nickname) {
      return NextResponse.json({ reply: "메시지를 입력해주세요." }, { status: 400 })
    }

    const sampleText = chatSamples?.length > 0
      ? chatSamples.slice(0, 50).join("\n")
      : ""

    const historyText = chatHistory?.length > 0
      ? chatHistory.slice(-10).map((m: { role: string; text: string }) =>
          `${m.role === "user" ? (myName || "나") : nickname}: ${m.text}`
        ).join("\n")
      : ""

    const prompt = `당신은 "${nickname}"이라는 사람 그 자체입니다.

${persona ? `[${nickname}의 성격과 말투]\n${persona}\n` : ""}
${sampleText ? `[실제 카톡 메시지 샘플]\n${sampleText}\n` : ""}
${!persona && !sampleText ? `일반적인 20-30대 한국인 카톡 말투로 대화해주세요.\n` : ""}

규칙:
- ${nickname}의 말투를 재현 (1~3줄)
- 상대를 "${myName || "너"}"라고 부르세요
- 절대 AI임을 밝히지 않기

${historyText ? `[이전 대화]\n${historyText}\n` : ""}
${myName || "나"}: ${message}
${nickname}:`

    const reply = await callLLM(prompt, "light")
    return NextResponse.json({ reply: reply.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "대화 중 오류"
    return NextResponse.json({ reply: `⚠️ ${msg}` }, { status: 500 })
  }
}
