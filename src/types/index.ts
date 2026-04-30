/** 천간 (Heavenly Stems) */
export type HeavenlyStem = '갑' | '을' | '병' | '정' | '무' | '기' | '경' | '신' | '임' | '계'

/** 지지 (Earthly Branches) */
export type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해'

/** 오행 (Five Elements) */
export type FiveElement = '목' | '화' | '토' | '금' | '수'

/** 사주 기둥 하나 */
export interface Pillar {
  stem: HeavenlyStem
  branch: EarthlyBranch
  element: FiveElement
  yinYang: '양' | '음'
}

/** 사주팔자 (Four Pillars) */
export interface FourPillars {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
}

/** 만세력 분석 결과 */
export interface ManseryeokResult {
  fourPillars: FourPillars
  dominantElement: FiveElement
  elementBalance: Record<FiveElement, number>
  summary: string
}

/** 카카오톡 메시지 */
export interface KakaoMessage {
  date: Date
  sender: string
  message: string
}

/** 카카오톡 분석 결과 */
export interface ChatAnalysis {
  totalMessages: number
  messagesByPerson: Record<string, number>
  avgResponseTime: Record<string, number>
  mostActiveHour: number
  sentimentScore: number
  topTopics: Array<{ topic: string; emoji: string; count: number; percentage: number }>
  loveTemperature: number
  dateRange: { start: Date; end: Date }
}

/** 묘지 등급 */
export type GraveGrade = 'national' | 'public' | 'sea'

export const GRAVE_GRADES: Record<GraveGrade, {
  name: string
  emoji: string
  description: string
  coins: number
  color: string
  bg: string
}> = {
  national: {
    name: '현충원',
    emoji: '🏛️',
    description: '가장 격조 높은 안식처. 잊을 수 없는 대연애를 위한 자리.',
    coins: 400,
    color: 'text-yellow-400',
    bg: 'bg-gradient-to-b from-yellow-900/20 to-cemetery-card',
  },
  public: {
    name: '공동묘지',
    emoji: '🪦',
    description: '다른 연애들과 함께 잠드는 곳. 가장 보편적인 선택.',
    coins: 300,
    color: 'text-cemetery-ghost',
    bg: 'bg-cemetery-card',
  },
  sea: {
    name: '수장',
    emoji: '🌊',
    description: '바다에 흘려보내기. 흔적도 없이 보내주고 싶을 때.',
    coins: 100,
    color: 'text-blue-400',
    bg: 'bg-gradient-to-b from-blue-900/20 to-cemetery-card',
  },
}

/** 묘비 (과거 연인 기록) */
export interface Grave {
  id: string
  nickname: string
  photo?: string  // base64 data URL
  grade: GraveGrade
  birthDate: string
  birthTime?: string
  myBirthDate: string
  myBirthTime?: string
  relationshipStart: string
  relationshipEnd: string
  causeOfDeath: string
  graveReason: string  // 이 묘지에 묻힌 이유 (상세 사연)
  epitaph: string
  chatFile?: File
  chatAnalysis?: ChatAnalysis
  persona?: string  // AI 채팅용 성격/말투 설명
  chatSamples?: string[]  // AI 채팅용 샘플 대화
  manseryeok?: ManseryeokResult
  myManseryeok?: ManseryeokResult
  compatibility?: CompatibilityResult
  createdAt: string
}

/** 궁합 분석 결과 */
export interface CompatibilityResult {
  score: number
  elementHarmony: string
  strengths: string[]
  weaknesses: string[]
  llmAnalysis?: string
}

/** 비교 분석 결과 */
export interface ComparisonResult {
  graveA: Grave
  graveB: Grave
  chatComparison?: {
    messageFrequency: string
    responsePattern: string
    sentimentDiff: string
  }
  manseryeokComparison?: {
    elementDiff: string
    compatibilityDiff: string
  }
  llmVerdict?: string
}
