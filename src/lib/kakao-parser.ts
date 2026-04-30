import type { KakaoMessage, ChatAnalysis } from "@/types"

/**
 * 카카오톡 텍스트 파일 파서
 *
 * 카카오톡 대화 내보내기 형식:
 * "2024년 1월 15일 오후 3:42, 홍길동 : 안녕하세요"
 * "2024. 1. 15. 오후 3:42, 홍길동 : 안녕하세요"
 * "[홍길동] [오후 3:42] 안녕하세요"
 */

// 카카오톡 날짜 패턴들
const PATTERNS = {
  // 2024년 1월 15일 오후 3:42, 홍길동 : 메시지
  dateKorean: /^(\d{4})년 (\d{1,2})월 (\d{1,2})일 (오전|오후) (\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.+)$/,
  // 2024. 1. 15. 오후 3:42, 홍길동 : 메시지
  dateDot: /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.+)$/,
  // [홍길동] [오후 3:42] 메시지
  bracket: /^\[(.+?)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*(.+)$/,
  // 날짜 구분선: --------------- 2024년 1월 15일 월요일 ---------------
  dateLine: /^-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*-+$/,
}

function parseKoreanTime(ampm: string, hour: number, minute: number): { h: number; m: number } {
  let h = hour
  if (ampm === "오후" && h !== 12) h += 12
  if (ampm === "오전" && h === 12) h = 0
  return { h, m: minute }
}

/**
 * CSV 형식 카카오톡 파서
 *
 * 일반적인 CSV 형식:
 * "Date","User","Message"
 * "2024-01-15 15:42:00","홍길동","안녕하세요"
 *
 * 또는 콤마 구분:
 * 2024-01-15 15:42,홍길동,안녕하세요
 */
export function parseKakaoCsv(text: string): KakaoMessage[] {
  const lines = text.split("\n")
  const messages: KakaoMessage[] = []

  // 헤더 행 감지 및 스킵
  let startIdx = 0
  if (lines.length > 0) {
    const first = lines[0].toLowerCase()
    if (first.includes("date") || first.includes("user") || first.includes("message") ||
        first.includes("날짜") || first.includes("보낸사람") || first.includes("내용")) {
      startIdx = 1
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    if (fields.length < 3) continue

    const dateStr = fields[0].trim()
    const sender = fields[1].trim()
    const message = fields.slice(2).join(",").trim()

    if (!sender || !message) continue

    const date = parseDateString(dateStr)
    if (!date) continue

    messages.push({ date, sender, message })
  }

  return messages
}

/** CSV 한 줄을 필드로 파싱 (따옴표 처리) */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/** 다양한 날짜 문자열 파싱 */
function parseDateString(str: string): Date | null {
  // "2024-01-15 15:42:00" or "2024-01-15 15:42"
  let match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match) {
    return new Date(
      parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
      parseInt(match[4]), parseInt(match[5]), parseInt(match[6] || "0")
    )
  }

  // "2024/01/15 15:42"
  match = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match) {
    return new Date(
      parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
      parseInt(match[4]), parseInt(match[5]), parseInt(match[6] || "0")
    )
  }

  // "2024.01.15 15:42"
  match = str.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match) {
    return new Date(
      parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]),
      parseInt(match[4]), parseInt(match[5]), parseInt(match[6] || "0")
    )
  }

  // 한국어: "2024년 1월 15일 오후 3:42"
  match = str.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/)
  if (match) {
    let h = parseInt(match[5])
    if (match[4] === "오후" && h !== 12) h += 12
    if (match[4] === "오전" && h === 12) h = 0
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), h, parseInt(match[6]))
  }

  // fallback: Date.parse
  const ts = Date.parse(str)
  return isNaN(ts) ? null : new Date(ts)
}

/** 파일 확장자에 따라 자동으로 적절한 파서 선택 */
export function parseKakaoFile(text: string, filename: string): KakaoMessage[] {
  const ext = filename.toLowerCase().split(".").pop()
  if (ext === "csv") {
    return parseKakaoCsv(text)
  }
  return parseKakaoChat(text)
}

export function parseKakaoChat(text: string): KakaoMessage[] {
  const lines = text.split("\n")
  const messages: KakaoMessage[] = []
  let currentDate = { year: 2024, month: 1, day: 1 }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 날짜 구분선 체크
    const dateMatch = trimmed.match(PATTERNS.dateLine)
    if (dateMatch) {
      currentDate = {
        year: parseInt(dateMatch[1]),
        month: parseInt(dateMatch[2]),
        day: parseInt(dateMatch[3]),
      }
      continue
    }

    // 한국어 날짜 형식
    let match = trimmed.match(PATTERNS.dateKorean)
    if (match) {
      const { h, m } = parseKoreanTime(match[4], parseInt(match[5]), parseInt(match[6]))
      messages.push({
        date: new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), h, m),
        sender: match[7].trim(),
        message: match[8].trim(),
      })
      continue
    }

    // 점 날짜 형식
    match = trimmed.match(PATTERNS.dateDot)
    if (match) {
      const { h, m } = parseKoreanTime(match[4], parseInt(match[5]), parseInt(match[6]))
      messages.push({
        date: new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), h, m),
        sender: match[7].trim(),
        message: match[8].trim(),
      })
      continue
    }

    // 대괄호 형식
    match = trimmed.match(PATTERNS.bracket)
    if (match) {
      const { h, m } = parseKoreanTime(match[2], parseInt(match[3]), parseInt(match[4]))
      messages.push({
        date: new Date(currentDate.year, currentDate.month - 1, currentDate.day, h, m),
        sender: match[1].trim(),
        message: match[5].trim(),
      })
      continue
    }
  }

  return messages
}

/** 파싱된 메시지들을 분석 */
export function analyzeChat(messages: KakaoMessage[]): ChatAnalysis {
  if (messages.length === 0) {
    return {
      totalMessages: 0,
      messagesByPerson: {},
      avgResponseTime: {},
      mostActiveHour: 0,
      sentimentScore: 50,
      topTopics: [],
      loveTemperature: 50,
      dateRange: { start: new Date(), end: new Date() },
    }
  }

  // 인원별 메시지 수
  const messagesByPerson: Record<string, number> = {}
  for (const msg of messages) {
    messagesByPerson[msg.sender] = (messagesByPerson[msg.sender] || 0) + 1
  }

  // 시간대별 활동
  const hourCounts = new Array(24).fill(0)
  for (const msg of messages) {
    hourCounts[msg.date.getHours()]++
  }
  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

  // 평균 응답 시간 (분)
  const avgResponseTime: Record<string, number> = {}
  const responseTimes: Record<string, number[]> = {}
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender !== messages[i - 1].sender) {
      const diff = (messages[i].date.getTime() - messages[i - 1].date.getTime()) / 60000
      if (diff < 1440) {
        // 24시간 이내만
        const sender = messages[i].sender
        if (!responseTimes[sender]) responseTimes[sender] = []
        responseTimes[sender].push(diff)
      }
    }
  }
  for (const [sender, times] of Object.entries(responseTimes)) {
    avgResponseTime[sender] = Math.round(
      times.reduce((a, b) => a + b, 0) / times.length
    )
  }

  // 감정 분석 (키워드 기반 간이 분석)
  const positiveWords = ["사랑", "좋아", "보고싶", "행복", "감사", "ㅋㅋ", "ㅎㅎ", "❤", "💕", "😍", "🥰", "귀여", "예쁘", "잘생"]
  const negativeWords = ["싫어", "짜증", "화나", "미안", "슬프", "힘들", "지겨", "ㅡㅡ", "답답", "그만", "왜그래"]

  let posCount = 0
  let negCount = 0
  for (const msg of messages) {
    const text = msg.message
    for (const w of positiveWords) {
      if (text.includes(w)) posCount++
    }
    for (const w of negativeWords) {
      if (text.includes(w)) negCount++
    }
  }
  const total = posCount + negCount || 1
  const sentimentScore = Math.round((posCount / total) * 100)

  // 대화 주제 분석
  const topTopics = extractTopics(messages)

  // 연애 온도 (다양한 지표 종합)
  const messageRatio = Object.values(messagesByPerson)
  const balanceScore = messageRatio.length === 2
    ? 100 - Math.abs(messageRatio[0] - messageRatio[1]) / Math.max(...messageRatio) * 50
    : 50
  const loveTemperature = Math.round((sentimentScore * 0.4 + balanceScore * 0.3 + 50 * 0.3))

  return {
    totalMessages: messages.length,
    messagesByPerson,
    avgResponseTime,
    mostActiveHour,
    sentimentScore,
    topTopics,
    loveTemperature,
    dateRange: {
      start: messages[0].date,
      end: messages[messages.length - 1].date,
    },
  }
}

/** 대화 주제 분류 시스템 */
interface TopicRule {
  topic: string
  emoji: string
  keywords: string[]
}

const TOPIC_RULES: TopicRule[] = [
  {
    topic: "애정 표현",
    emoji: "💕",
    keywords: ["사랑", "좋아", "보고싶", "보고싶다", "안아", "뽀뽀", "사랑해", "좋아해", "심쿵", "설레", "두근", "예쁘", "잘생", "귀여", "자기야", "여보", "허니", "베이비", "자기", "이쁘", "❤", "💕", "😍", "🥰", "💗", "😘", "♥"],
  },
  {
    topic: "밥/음식",
    emoji: "🍽️",
    keywords: ["밥", "먹자", "먹을", "먹고", "맛집", "맛있", "배고", "치킨", "피자", "라면", "카페", "커피", "디저트", "빵", "초밥", "삼겹살", "떡볶이", "족발", "배달", "저녁", "점심", "아침", "브런치", "맥주", "소주", "술", "회식"],
  },
  {
    topic: "약속/데이트",
    emoji: "📅",
    keywords: ["만나", "만날", "볼까", "보자", "데이트", "약속", "주말", "토요일", "일요일", "금요일", "몇시", "몇 시", "언제", "어디서", "나올", "나와", "올래", "갈래", "시간", "오늘 뭐해", "내일 뭐해"],
  },
  {
    topic: "일상/안부",
    emoji: "☀️",
    keywords: ["뭐해", "뭐하", "잘 잤", "잘잤", "굿모닝", "굿밤", "잘자", "좋은 아침", "좋은아침", "집 도착", "출근", "퇴근", "씻고", "자러", "일어났", "피곤", "졸려"],
  },
  {
    topic: "직장/학교",
    emoji: "💼",
    keywords: ["회사", "직장", "상사", "팀장", "과장", "부장", "사수", "동료", "프로젝트", "야근", "출장", "회의", "학교", "수업", "과제", "시험", "교수", "학점", "알바", "인턴"],
  },
  {
    topic: "감정 공유",
    emoji: "🥺",
    keywords: ["힘들", "지치", "스트레스", "짜증", "화나", "슬프", "우울", "걱정", "불안", "외로", "서운", "속상", "답답", "눈물", "울었", "위로", "괜찮", "힘내", "응원", "고마워", "감사"],
  },
  {
    topic: "싸움/갈등",
    emoji: "⚡",
    keywords: ["싫어", "화났", "짜증나", "미안", "잘못", "왜 그래", "왜그래", "어이없", "황당", "이해 안", "이해안", "그만", "하지마", "지겨", "실망", "거짓말", "변명", "무시", "차단"],
  },
  {
    topic: "여행/외출",
    emoji: "✈️",
    keywords: ["여행", "비행기", "호텔", "숙소", "바다", "산", "캠핑", "드라이브", "놀러", "놀이공원", "영화", "공연", "전시", "콘서트", "페스티벌", "제주", "부산", "해외"],
  },
  {
    topic: "쇼핑/선물",
    emoji: "🎁",
    keywords: ["사줄", "사줘", "선물", "쇼핑", "구매", "주문", "배송", "택배", "이쁜", "옷", "신발", "가방", "화장품", "생일", "기념일", "이벤트", "서프라이즈"],
  },
  {
    topic: "게임/취미",
    emoji: "🎮",
    keywords: ["게임", "롤", "배그", "오버워치", "발로란트", "스팀", "닌텐도", "플스", "유튜브", "넷플릭스", "드라마", "웹툰", "운동", "헬스", "러닝", "등산", "요가"],
  },
  {
    topic: "미래 계획",
    emoji: "🌟",
    keywords: ["결혼", "동거", "같이 살", "미래", "나중에", "계획", "목표", "이사", "집", "전세", "월세", "저축", "돈 모", "취업", "이직"],
  },
  {
    topic: "건강/몸 상태",
    emoji: "🏥",
    keywords: ["아파", "아프", "감기", "두통", "약 먹", "병원", "몸살", "열나", "기침", "코로나", "건강", "다이어트", "살찌", "살빠"],
  },
  {
    topic: "가족/친구",
    emoji: "👨‍👩‍👧",
    keywords: ["엄마", "아빠", "부모님", "언니", "오빠", "형", "누나", "동생", "친구", "모임", "동창", "선배", "후배"],
  },
  {
    topic: "반려동물",
    emoji: "🐾",
    keywords: ["강아지", "고양이", "멍멍", "냥냥", "댕댕", "산책", "사료", "간식", "병원", "예방접종"],
  },
]

function extractTopics(messages: KakaoMessage[]): Array<{ topic: string; emoji: string; count: number; percentage: number }> {
  const topicCounts: Record<string, { emoji: string; count: number }> = {}

  // 주제별 카운트 (메시지 단위로 분류)
  let classifiedCount = 0

  for (const msg of messages) {
    const text = msg.message.toLowerCase()
    if (text.length < 3) continue // 너무 짧은 메시지 스킵

    const matchedTopics = new Set<string>()

    for (const rule of TOPIC_RULES) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          matchedTopics.add(rule.topic)
          if (!topicCounts[rule.topic]) {
            topicCounts[rule.topic] = { emoji: rule.emoji, count: 0 }
          }
          topicCounts[rule.topic].count++
          break // 한 토픽당 한 번만 카운트
        }
      }
    }

    if (matchedTopics.size > 0) classifiedCount++
  }

  const totalClassified = classifiedCount || 1

  return Object.entries(topicCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([topic, { emoji, count }]) => ({
      topic,
      emoji,
      count,
      percentage: Math.round((count / totalClassified) * 100),
    }))
}
