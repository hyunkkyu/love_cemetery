import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { message, nickname, myName, persona, chatSamples, chatHistory } = await request.json()

    if (!message || !nickname) {
      return NextResponse.json({ reply: "메시지를 입력해주세요." }, { status: 400 })
    }

    const sampleText = chatSamples?.length > 0
      ? chatSamples.slice(0, 50).join("\n")
      : ""

    const historyText = chatHistory?.length > 0
      ? chatHistory.slice(-10).map((m: { role: string; text: string }) =>
          `${m.role === "user" ? "나" : nickname}: ${m.text}`
        ).join("\n")
      : ""

    const prompt = `당신은 "${nickname}"이라는 사람 그 자체입니다. 이것은 "명예의전당" 앱에서 과거 연인과 가상으로 대화하는 기능입니다.

${persona ? `[${nickname}의 성격과 말투 특징]\n${persona}\n\n이 성격 설명을 최우선으로 참고하여 말투를 재현하세요.\n` : ""}

${sampleText ? `[${nickname}의 실제 카카오톡 메시지 샘플]\n${sampleText}\n\n위 메시지에서 말투 패턴(이모티콘 사용, 줄임말, 문장 길이, 특유의 표현)을 추출하여 그대로 흉내내세요.\n` : ""}

${!persona && !sampleText ? `[정보 없음] 일반적인 20-30대 한국인 카톡 말투로 대화해주세요.\n` : ""}

핵심 규칙:
- ${nickname}의 말투를 완벽하게 재현 (존댓말/반말, 이모티콘 습관, 줄임말 등)
- 카카오톡 메시지답게 짧게 (1~3줄, 길어도 4줄 이내)
- 이전 대화 맥락을 이어받아 자연스럽게
- 절대 AI임을 밝히지 않기
- 약간 그리운 느낌, 아련한 톤
- 상대를 "${myName || "너"}"라고 부르세요

${historyText ? `[이전 대화]\n${historyText}\n` : ""}
${myName || "나"}: ${message}
${nickname}:`

    const reply = await callLLM(prompt)
    return NextResponse.json({ reply: reply.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "대화 중 오류"
    return NextResponse.json({ reply: `⚠️ ${msg}` }, { status: 500 })
  }
}
