"use client"

import { useState, useEffect, useRef, use } from "react"
import { useSession } from "next-auth/react"
import { dbGraves, dbChat } from "@/lib/api-client"
import type { Grave } from "@/types"

interface ChatMessage {
  role: "user" | "ghost"
  text: string
  time: string
}


export default function GraveChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id

  const [grave, setGrave] = useState<Grave | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [myName, setMyName] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    async function load() {
      const g = await dbGraves.get(userId!, id)
      if (!g) return
      setGrave(g as unknown as Grave)

      const savedName = localStorage.getItem(`chat-myname-${id}`) || session?.user?.name || "너"
      setMyName(savedName)

      const chatData = await dbChat.get(userId!, id)
      if (chatData?.messages?.length > 0) {
        setMessages(chatData.messages)
      } else {
        setMessages([{
          role: "ghost",
          text: `...여기가 어디지? 아, ${savedName}야? 오랜만이다.`,
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        }])
      }
      setLoaded(true)
    }
    load()
  }, [id, userId, session])

  // 메시지 변경 시 자동 저장 + 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    if (loaded && userId && messages.length > 0) {
      dbChat.save(userId, id, messages)
    }
  }, [messages, loaded, userId, id])

  const sendMessage = async () => {
    if (!input.trim() || !grave || sending) return

    const userMsg: ChatMessage = {
      role: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          nickname: grave.nickname,
          myName,
          persona: grave.persona,
          chatSamples: grave.chatSamples,
          chatHistory: newMessages.slice(-20).map((m) => ({ role: m.role, text: m.text })),
        }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: "ghost",
          text: data.reply,
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ghost",
          text: "...잘 안 들려. 다시 말해줄래?",
          time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleClearHistory = () => {
    if (!userId || !grave) return
    if (!confirm(`${grave.nickname}와의 대화 기록을 모두 지울까요?`)) return
    const initial: ChatMessage[] = [{
      role: "ghost",
      text: `...다시 처음부터? 좋아, ${session?.user?.name || "너"}야.`,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }]
    setMessages(initial)
    dbChat.save(userId, id, initial)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!grave) {
    return (
      <div className="text-center py-20 text-cemetery-ghost">
        묘비를 찾을 수 없습니다...
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* 채팅 헤더 */}
      <div className="flex items-center gap-3 pb-4 border-b border-cemetery-border">
        <a href={`/grave/${id}`} className="text-cemetery-ghost hover:text-cemetery-heading">
          ←
        </a>
        {grave.photo ? (
          <img
            src={grave.photo}
            alt={grave.nickname}
            className="w-10 h-10 rounded-full object-cover grayscale-[50%] border border-cemetery-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-cemetery-surface flex items-center justify-center text-lg">
            👻
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-gothic text-cemetery-heading font-bold">{grave.nickname}</h2>
          <p className="text-[10px] text-cemetery-ghost/50">
            저세상에서 접속 중 · 대화 {messages.length}개
          </p>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-[10px] text-cemetery-ghost/30 hover:text-red-400 transition-colors px-2 py-1"
          title="대화 기록 초기화"
        >
          🗑️
        </button>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* 안내 메시지 */}
        <div className="text-center space-y-1">
          <span className="text-[10px] text-cemetery-ghost/40 bg-cemetery-surface px-3 py-1 rounded-full">
            이 대화는 AI가 카톡 패턴을 학습하여 재현합니다
          </span>
          {messages.length > 1 && (
            <p className="text-[9px] text-cemetery-ghost/25">
              대화 기록이 자동 저장됩니다
            </p>
          )}
        </div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ghost" && (
              <div className="flex-shrink-0 mr-2">
                {grave.photo ? (
                  <img
                    src={grave.photo}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover grayscale-[50%]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cemetery-surface flex items-center justify-center text-sm ghost-float">
                    👻
                  </div>
                )}
              </div>
            )}
            <div>
              {msg.role === "ghost" && (
                <span className="text-[10px] text-cemetery-ghost/40 mb-1 block">
                  {grave.nickname}
                </span>
              )}
              <div
                className={`px-4 py-2 rounded-2xl max-w-[280px] ${
                  msg.role === "user"
                    ? "bg-cemetery-accent text-white rounded-br-sm"
                    : "bg-cemetery-card border border-cemetery-border text-cemetery-text rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className={`text-[10px] text-cemetery-ghost/30 mt-1 block ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 mr-2">
              <div className="w-8 h-8 rounded-full bg-cemetery-surface flex items-center justify-center text-sm ghost-float">
                👻
              </div>
            </div>
            <div className="px-4 py-3 bg-cemetery-card border border-cemetery-border rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-cemetery-ghost/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-cemetery-border pt-3 pb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${grave.nickname}에게 말하기...`}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-cemetery-surface border border-cemetery-border rounded-full
              text-cemetery-text placeholder-cemetery-ghost/40 focus:border-cemetery-accent focus:outline-none
              disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-cemetery-accent hover:bg-cemetery-accent-dim disabled:opacity-50
              rounded-full transition-colors"
          >
            💬
          </button>
        </div>
      </div>
    </div>
  )
}
