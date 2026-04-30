import type {
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  Pillar,
  FourPillars,
  ManseryeokResult,
} from "@/types"

const STEMS: HeavenlyStem[] = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const BRANCHES: EarthlyBranch[] = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

const STEM_ELEMENTS: Record<HeavenlyStem, FiveElement> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
}

const BRANCH_ELEMENTS: Record<EarthlyBranch, FiveElement> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
}

const STEM_YINYANG: Record<HeavenlyStem, "양" | "음"> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양",
  기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
}

const ELEMENT_NAMES: Record<FiveElement, string> = {
  목: "나무 (木)", 화: "불 (火)", 토: "흙 (土)", 금: "쇠 (金)", 수: "물 (水)",
}

const ELEMENT_TRAITS: Record<FiveElement, string> = {
  목: "성장, 인자함, 창의성",
  화: "열정, 예의, 활력",
  토: "안정, 신뢰, 중재",
  금: "결단, 의리, 강인함",
  수: "지혜, 유연함, 소통",
}

/** 절기 기반 월주 계산을 위한 절기 데이터 (간략화) */
const SOLAR_TERMS_MONTH = [
  { month: 1, startDay: 6 },   // 소한
  { month: 2, startDay: 4 },   // 입춘
  { month: 3, startDay: 6 },   // 경칩
  { month: 4, startDay: 5 },   // 청명
  { month: 5, startDay: 6 },   // 입하
  { month: 6, startDay: 6 },   // 망종
  { month: 7, startDay: 7 },   // 소서
  { month: 8, startDay: 8 },   // 입추
  { month: 9, startDay: 8 },   // 백로
  { month: 10, startDay: 9 },  // 한로
  { month: 11, startDay: 8 },  // 입동
  { month: 12, startDay: 7 },  // 대설
]

function makePillar(stemIdx: number, branchIdx: number): Pillar {
  const stem = STEMS[stemIdx % 10]
  const branch = BRANCHES[branchIdx % 12]
  return {
    stem,
    branch,
    element: STEM_ELEMENTS[stem],
    yinYang: STEM_YINYANG[stem],
  }
}

/** 연주 계산 */
function getYearPillar(year: number, month: number, day: number): Pillar {
  // 입춘(2월 4일경) 이전이면 전년도
  const adjustedYear = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year
  const stemIdx = (adjustedYear - 4) % 10
  const branchIdx = (adjustedYear - 4) % 12
  return makePillar(stemIdx, branchIdx)
}

/** 월주 계산 */
function getMonthPillar(year: number, month: number, day: number): Pillar {
  // 절기 기반 월 보정
  let lunarMonth = month
  const term = SOLAR_TERMS_MONTH.find((t) => t.month === month)
  if (term && day < term.startDay) {
    lunarMonth = month === 1 ? 12 : month - 1
  }

  // 월주 천간은 연간에 의해 결정
  const yearStemIdx = (year - 4) % 10
  const monthStemBase = (yearStemIdx % 5) * 2
  const monthStemIdx = (monthStemBase + (lunarMonth - 1)) % 10

  // 월주 지지: 인월(1월=寅)부터
  const monthBranchIdx = (lunarMonth + 1) % 12
  return makePillar(monthStemIdx, monthBranchIdx)
}

/** 일주 계산 (간략 공식) */
function getDayPillar(year: number, month: number, day: number): Pillar {
  // 율리우스 적일 기반 일진 계산
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  const stemIdx = (jdn - 1) % 10
  const branchIdx = (jdn + 1) % 12
  return makePillar(stemIdx, branchIdx)
}

/** 시주 계산 */
function getHourPillar(dayStemIdx: number, hour: number): Pillar {
  // 시간을 시지로 변환 (23-01: 자, 01-03: 축, ...)
  const branchIdx = Math.floor(((hour + 1) % 24) / 2)

  // 시간 천간은 일간에 의해 결정
  const hourStemBase = (dayStemIdx % 5) * 2
  const hourStemIdx = (hourStemBase + branchIdx) % 10

  return makePillar(hourStemIdx, branchIdx)
}

/** 오행 비율 계산 */
function calculateElementBalance(pillars: FourPillars): Record<FiveElement, number> {
  const counts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  const allPillars = [pillars.year, pillars.month, pillars.day, pillars.hour]

  for (const p of allPillars) {
    counts[STEM_ELEMENTS[p.stem]] += 1
    counts[BRANCH_ELEMENTS[p.branch]] += 1
  }

  return counts
}

/** 만세력 계산 메인 함수 */
export function calculateManseryeok(
  year: number,
  month: number,
  day: number,
  hour: number = 12
): ManseryeokResult {
  const yearPillar = getYearPillar(year, month, day)
  const monthPillar = getMonthPillar(year, month, day)
  const dayPillar = getDayPillar(year, month, day)

  const dayStemIdx = STEMS.indexOf(dayPillar.stem)
  const hourPillar = getHourPillar(dayStemIdx, hour)

  const fourPillars: FourPillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  }

  const elementBalance = calculateElementBalance(fourPillars)
  const dominantElement = (Object.entries(elementBalance) as [FiveElement, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  const summary = generateSummary(fourPillars, dominantElement, elementBalance)

  return { fourPillars, dominantElement, elementBalance, summary }
}

function generateSummary(
  pillars: FourPillars,
  dominant: FiveElement,
  balance: Record<FiveElement, number>
): string {
  const dayMaster = pillars.day.stem
  const dayElement = STEM_ELEMENTS[dayMaster]

  const lines = [
    `일간(日干): ${dayMaster} (${ELEMENT_NAMES[dayElement]})`,
    `주요 성향: ${ELEMENT_TRAITS[dayElement]}`,
    ``,
    `사주 구성:`,
    `  연주(年柱): ${pillars.year.stem}${pillars.year.branch}`,
    `  월주(月柱): ${pillars.month.stem}${pillars.month.branch}`,
    `  일주(日柱): ${pillars.day.stem}${pillars.day.branch}`,
    `  시주(時柱): ${pillars.hour.stem}${pillars.hour.branch}`,
    ``,
    `오행 분포: 목(${balance.목}) 화(${balance.화}) 토(${balance.토}) 금(${balance.금}) 수(${balance.수})`,
    `지배 오행: ${ELEMENT_NAMES[dominant]} - ${ELEMENT_TRAITS[dominant]}`,
  ]

  // 부족한 오행 체크
  const missing = (Object.entries(balance) as [FiveElement, number][])
    .filter(([, v]) => v === 0)
    .map(([k]) => ELEMENT_NAMES[k])
  if (missing.length > 0) {
    lines.push(`부족한 오행: ${missing.join(", ")}`)
  }

  return lines.join("\n")
}

// ===== 궁합 분석 시스템 =====

/** 천간합 (天干合) - 합이 되는 천간 쌍 */
const STEM_COMBINATIONS: [HeavenlyStem, HeavenlyStem, string][] = [
  ["갑", "기", "갑기합토(甲己合土) - 중후하고 신뢰가 깊은 관계"],
  ["을", "경", "을경합금(乙庚合金) - 의리와 결속력이 강한 관계"],
  ["병", "신", "병신합수(丙辛合水) - 지적이고 로맨틱한 관계"],
  ["정", "임", "정임합목(丁壬合木) - 성장을 돕는 관계"],
  ["무", "계", "무계합화(戊癸合火) - 열정적이고 활력 넘치는 관계"],
]

/** 지지 육합 (地支六合) */
const BRANCH_COMBINATIONS: [EarthlyBranch, EarthlyBranch, string][] = [
  ["자", "축", "자축합토 - 은밀하고 깊은 정"],
  ["인", "해", "인해합목 - 함께 성장하는 관계"],
  ["묘", "술", "묘술합화 - 열정적인 끌림"],
  ["진", "유", "진유합금 - 단단한 신뢰"],
  ["사", "신", "사신합수 - 지적 교감"],
  ["오", "미", "오미합 - 따뜻한 정"],
]

/** 지지 삼합 (地支三合) */
const BRANCH_TRIPLES: [EarthlyBranch[], FiveElement, string][] = [
  [["신", "자", "진"], "수", "수국삼합 - 지혜와 소통의 조합"],
  [["해", "묘", "미"], "목", "목국삼합 - 성장과 창의의 조합"],
  [["인", "오", "술"], "화", "화국삼합 - 열정과 활력의 조합"],
  [["사", "유", "축"], "금", "금국삼합 - 결단과 실행의 조합"],
]

/** 지지충 (地支衝) - 충돌하는 지지 쌍 */
const BRANCH_CLASHES: [EarthlyBranch, EarthlyBranch, string][] = [
  ["자", "오", "자오충 - 감정 충돌, 밀당이 심할 수 있음"],
  ["축", "미", "축미충 - 가치관 차이"],
  ["인", "신", "인신충 - 주도권 경쟁"],
  ["묘", "유", "묘유충 - 성격 충돌"],
  ["진", "술", "진술충 - 고집 대 고집"],
  ["사", "해", "사해충 - 방향성 차이"],
]

/** 십성 관계 판별 */
function getTenGodRelation(myStem: HeavenlyStem, otherStem: HeavenlyStem): string {
  const myEl = STEM_ELEMENTS[myStem]
  const otherEl = STEM_ELEMENTS[otherStem]
  const myYY = STEM_YINYANG[myStem]
  const otherYY = STEM_YINYANG[otherStem]
  const same = myYY === otherYY

  if (myEl === otherEl) return same ? "비견(比肩) - 동지, 라이벌" : "겁재(劫財) - 경쟁적 동반자"

  const gen: Record<FiveElement, FiveElement> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" }
  const ctrl: Record<FiveElement, FiveElement> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" }

  if (gen[myEl] === otherEl) return same ? "식신(食神) - 편안한 관계" : "상관(傷官) - 자극적인 관계"
  if (gen[otherEl] === myEl) return same ? "편인(偏印) - 은근한 지지" : "정인(正印) - 든든한 후원자"
  if (ctrl[myEl] === otherEl) return same ? "편재(偏財) - 로맨틱한 끌림" : "정재(正財) - 안정적 애정"
  if (ctrl[otherEl] === myEl) return same ? "편관(偏官) - 강렬한 끌림" : "정관(正官) - 존경과 신뢰"

  return "특수 관계"
}

/** 조후(調候) 보완 분석 */
function analyzeJohu(a: ManseryeokResult, b: ManseryeokResult): { score: number; desc: string } {
  const aBalance = a.elementBalance
  const bBalance = b.elementBalance

  // 사주가 차가운지(금수 과다) 뜨거운지(목화 과다) 판단
  const aHot = aBalance.화 + aBalance.목
  const aCold = aBalance.금 + aBalance.수
  const bHot = bBalance.화 + bBalance.목
  const bCold = bBalance.금 + bBalance.수

  const aTemp = aHot - aCold // 양수면 뜨거움, 음수면 차가움
  const bTemp = bHot - bCold

  // 서로 반대 온도면 조후 보완
  if ((aTemp > 2 && bTemp < -1) || (aTemp < -1 && bTemp > 2)) {
    return { score: 15, desc: "조후 보완이 탁월합니다. 한쪽의 차가움을 다른 쪽의 따뜻함이 녹여주는 형국이에요." }
  }
  if ((aTemp > 0 && bTemp < 0) || (aTemp < 0 && bTemp > 0)) {
    return { score: 8, desc: "조후가 적당히 보완됩니다. 서로의 기운이 균형을 맞춰줘요." }
  }
  if ((aTemp > 2 && bTemp > 2) || (aTemp < -2 && bTemp < -2)) {
    return { score: -5, desc: "조후 편중 주의. 둘 다 비슷한 기운이라 한쪽으로 치우칠 수 있어요." }
  }
  return { score: 0, desc: "조후 영향은 보통 수준입니다." }
}

/** 두 사람의 전반적 궁합 분석 */
export function calculateCompatibility(
  a: ManseryeokResult,
  b: ManseryeokResult
): { score: number; strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []
  let score = 50

  const stemA = a.fourPillars.day.stem
  const stemB = b.fourPillars.day.stem
  const dayA = STEM_ELEMENTS[stemA]
  const dayB = STEM_ELEMENTS[stemB]

  // ① 일간 상생/상극
  const generating: [FiveElement, FiveElement][] = [
    ["목", "화"], ["화", "토"], ["토", "금"], ["금", "수"], ["수", "목"],
  ]
  const overcoming: [FiveElement, FiveElement][] = [
    ["목", "토"], ["토", "수"], ["수", "화"], ["화", "금"], ["금", "목"],
  ]

  if (generating.some(([x, y]) => (x === dayA && y === dayB) || (x === dayB && y === dayA))) {
    score += 12
    strengths.push(`오행 상생: ${dayA}(${stemA})과 ${dayB}(${stemB})가 서로를 살려주는 관계`)
  }
  if (overcoming.some(([x, y]) => (x === dayA && y === dayB) || (x === dayB && y === dayA))) {
    score -= 8
    weaknesses.push(`오행 상극: ${dayA}(${stemA})과 ${dayB}(${stemB}) 사이에 견제가 있는 관계`)
  }
  if (dayA === dayB) {
    score += 3
    strengths.push(`동일 오행: 둘 다 ${dayA} 기운이라 서로 이해가 빠른 관계`)
  }

  // ② 천간합
  for (const [s1, s2, desc] of STEM_COMBINATIONS) {
    if ((stemA === s1 && stemB === s2) || (stemA === s2 && stemB === s1)) {
      score += 18
      strengths.push(`천간합(天干合): ${desc}`)
      break
    }
  }

  // ③ 음양 조화
  if (a.fourPillars.day.yinYang !== b.fourPillars.day.yinYang) {
    score += 8
    strengths.push(`음양 조화: ${stemA}(${a.fourPillars.day.yinYang})과 ${stemB}(${b.fourPillars.day.yinYang})가 서로 보완`)
  }

  // ④ 지지 육합 (일지 기준)
  const branchA = a.fourPillars.day.branch
  const branchB = b.fourPillars.day.branch
  for (const [b1, b2, desc] of BRANCH_COMBINATIONS) {
    if ((branchA === b1 && branchB === b2) || (branchA === b2 && branchB === b1)) {
      score += 15
      strengths.push(`지지 육합: ${branchA}${branchB} ${desc}`)
      break
    }
  }

  // ⑤ 지지 삼합 (두 사람 일지가 삼합에 포함)
  for (const [branches, el, desc] of BRANCH_TRIPLES) {
    if (branches.includes(branchA) && branches.includes(branchB) && branchA !== branchB) {
      score += 10
      strengths.push(`지지 삼합: ${el}국(${branchA}+${branchB}) ${desc}`)
      break
    }
  }

  // ⑥ 지지충
  for (const [c1, c2, desc] of BRANCH_CLASHES) {
    if ((branchA === c1 && branchB === c2) || (branchA === c2 && branchB === c1)) {
      score -= 12
      weaknesses.push(`지지충: ${branchA}${branchB} ${desc}`)
      break
    }
  }

  // ⑦ 연지(년주) 궁합도 체크
  const yearBrA = a.fourPillars.year.branch
  const yearBrB = b.fourPillars.year.branch
  for (const [b1, b2, desc] of BRANCH_COMBINATIONS) {
    if ((yearBrA === b1 && yearBrB === b2) || (yearBrA === b2 && yearBrB === b1)) {
      score += 5
      strengths.push(`연지 육합: 띠 궁합이 좋음 (${yearBrA}${yearBrB} ${desc.split(" - ")[0]})`)
      break
    }
  }
  for (const [c1, c2, desc] of BRANCH_CLASHES) {
    if ((yearBrA === c1 && yearBrB === c2) || (yearBrA === c2 && yearBrB === c1)) {
      score -= 5
      weaknesses.push(`연지충: 띠 충돌 (${yearBrA}${yearBrB} ${desc.split(" - ")[0]})`)
      break
    }
  }

  // ⑧ 십성 관계
  const tenGod = getTenGodRelation(stemA, stemB)
  if (tenGod.includes("정재") || tenGod.includes("정관")) {
    score += 10
    strengths.push(`십성: ${tenGod}`)
  } else if (tenGod.includes("편재") || tenGod.includes("편관")) {
    score += 6
    strengths.push(`십성: ${tenGod}`)
  } else if (tenGod.includes("식신") || tenGod.includes("정인")) {
    score += 7
    strengths.push(`십성: ${tenGod}`)
  } else if (tenGod.includes("겁재") || tenGod.includes("상관")) {
    score -= 3
    weaknesses.push(`십성: ${tenGod}`)
  } else {
    strengths.push(`십성: ${tenGod}`)
  }

  // ⑨ 오행 상호보완
  const elements: FiveElement[] = ["목", "화", "토", "금", "수"]
  let complementCount = 0
  for (const el of elements) {
    if (a.elementBalance[el] === 0 && b.elementBalance[el] > 0) {
      complementCount++
    }
    if (b.elementBalance[el] === 0 && a.elementBalance[el] > 0) {
      complementCount++
    }
  }
  if (complementCount >= 3) {
    score += 12
    strengths.push(`오행 상호보완 탁월: 서로에게 없는 기운을 ${complementCount}개나 채워줌`)
  } else if (complementCount >= 1) {
    score += complementCount * 3
    strengths.push(`오행 보완: 서로 부족한 오행을 ${complementCount}개 채워주는 관계`)
  }

  // ⑩ 조후 분석
  const johu = analyzeJohu(a, b)
  score += johu.score
  if (johu.score > 0) {
    strengths.push(`조후(調候): ${johu.desc}`)
  } else if (johu.score < 0) {
    weaknesses.push(`조후(調候): ${johu.desc}`)
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
  }
}
