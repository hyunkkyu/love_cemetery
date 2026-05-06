"use client"

import { useState } from "react"

interface Notice {
  version: string
  date: string
  title: string
  type: "feature" | "fix" | "improve"
  items: string[]
}

const TYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  feature: { label: "새 기능", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  fix: { label: "버그 수정", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  improve: { label: "개선", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
}

const NOTICES: Notice[] = [
  {
    version: "2.0.0",
    date: "2026-04-30",
    title: "MongoDB Atlas 전환 & 튜토리얼 & 가독성 개선",
    type: "improve",
    items: [
      "☁️ MongoDB Atlas 클라우드 전환: Vercel + 내부망 + 로컬 모두 동일 DB 공유",
      "📖 신규 유저 튜토리얼: 첫 로그인 시 7단계 온보딩 가이드",
      "👁️ 가독성 대폭 개선: 텍스트 밝기/크기/자간 조정, 폰트 렌더링 최적화",
      "🔗 GitHub 연동: 소스코드 GitHub에 push + Vercel 자동 배포",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-04-29",
    title: "연애 상담소 & 공지사항",
    type: "feature",
    items: [
      "🧙 연애 상담소: AI 전문 상담사에게 맞춤 연애 상담 (과거 연애+사주 기반)",
      "💬 하루 3회 무료, 이후 1회당 20코인",
      "📋 상담 이력 자동 저장, 이전 상담 맥락 이어서 상담 가능",
      "📢 공지사항 페이지: 기능 가이드 + 전체 업데이트 이력",
      "❤️‍🔥 불타는 하트 파비콘 (Chrome SVG + Safari PNG 호환)",
      "💀 동반자 찾기: 검색 → 유저 목록 선택 방식으로 개선",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-04-29",
    title: "영혼의동반자 & 아이템 시스템 수정",
    type: "feature",
    items: [
      "💀 영혼의동반자: 다른 유저와 동반자 신청/수락 후 서로의 묘비를 열람하고 코멘트를 남길 수 있습니다",
      "👥 동반자 찾기: 유저 목록에서 선택하여 신청",
      "💬 묘비 코멘트: 동반자의 묘비에 조언/응원 코멘트 (작성 시 +5코인)",
      "✨ 아이템 장착 DB 동기화: 상점 구매 → 묘비 장착 → 드래그 배치가 모든 기기에서 동기화",
      "🔧 묘비 등록 버그 수정: crypto.randomUUID 호환성, ObjectId 캐스팅 오류 해결",
      "📝 Enter 키 폼 제출 방지: 날짜 입력 중 실수로 등록되는 문제 수정",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-29",
    title: "랭킹/통계 & 오늘의 연애 사주",
    type: "feature",
    items: [
      "📊 통계 페이지: 묘비 수 TOP 50 랭킹, MBTI별/일주별 유저 통계",
      "💡 내 인사이트: 나와 같은 MBTI+일주 그룹의 연애 패턴 분석",
      "🔮 오늘의 연애 사주: 로그인 시 데일리 운세 팝업 (오행별 조언 + 묘비 구성별 격려)",
      "🧠 MBTI 등록: 사주 프로필에 MBTI 선택 기능 추가",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-29",
    title: "보안 및 안정성 대폭 강화",
    type: "fix",
    items: [
      "🔐 서버측 세션 인증: 모든 API에 서버 인증 추가 (사용자 데이터 보호)",
      "🛡️ NoSQL 인젝션 방지: 입력값 검증 및 새니타이즈",
      "⚡ 코인 레이스 컨디션 수정: 원자적 DB 연산으로 코인 무결성 보장",
      "🔄 DB 연결 복구: 연결 실패 시 자동 재시도",
      "📱 크로스 브라우저: Safari/Firefox 호환성 개선",
      "⚠️ 세션 만료 팝업: 세션 만료 시 자동 감지 + 재로그인 유도",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-28",
    title: "MongoDB 연동 & 서버 배포",
    type: "feature",
    items: [
      "🗄️ MongoDB 연동: 모든 데이터가 서버 DB에 저장 (어떤 기기에서든 접근 가능)",
      "🌐 내부망 배포: 사내 서버에서 접속 가능",
      "👤 사용자별 데이터 분리: 로그인하면 자기만의 묘지/코인/아이템 관리",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-27",
    title: "커뮤니티 & 피드백",
    type: "feature",
    items: [
      "👻 커뮤니티: 연애토크/사주해석/고민상담/궁합추천 4개 카테고리 게시판",
      "💘 궁합 매칭: 사주 프로필 등록 → 오행 상성 기반 상위 5명 매칭 (30코인)",
      "👍 좋아요/댓글: 게시글 공감 + 댓글 작성 (코인 보상)",
      "💌 피드백 위젯: 오른쪽 하단 버튼으로 개발자에게 메시지 전송",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-27",
    title: "살랑살랑 & 묘비 편집",
    type: "feature",
    items: [
      "💘 살랑살랑: 현재 썸/연애 상대 분석 (핑크 테마), 과거 연애와 비교",
      "📋 분석 기록: AI 분석 결과 자동 저장, 이력 열람",
      "✏️ 묘비 편집: 상세 페이지에서 기존 묘비 정보 수정",
      "💾 대화 기록 저장: AI 채팅 내용 자동 저장 + 초기화",
      "👻 대화 이름 설정: 상대가 나를 부르는 이름 커스텀",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-24",
    title: "사진 업로드 & AI 채팅 & 묘지 등급",
    type: "feature",
    items: [
      "📷 영정 사진: 묘비에 인물 사진 업로드 (자동 크롭)",
      "👻 AI 채팅: 카톡 패턴 학습 기반 과거 연인과의 가상 대화",
      "🏛️ 묘지 등급: 현충원(400코인)/공동묘지(300)/수장(100) 등급 시스템",
      "🎭 페르소나 입력: AI 대화에 상대 성격/말투 반영",
      "📝 묘비 사연: 이 묘지에 묻힌 이유 작성란",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-24",
    title: "픽셀아트 상점 & 로그인",
    type: "feature",
    items: [
      "🎨 픽셀아트 상점: 찰리와 걷기 스타일 25개 도트 아이템",
      "🔐 로그인 시스템: 닉네임+비밀번호 인증, 사용자별 데이터",
      "🪙 코인 시스템: 묘비 등록 시 코인 보상, 아이템 구매",
      "💀 저주 아이템: 저주인형, 핏자국, 복수 부적",
      "🌙 으스스한 오프닝: 유령 등장 애니메이션",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-24",
    title: "명예의전당 최초 릴리즈",
    type: "feature",
    items: [
      "🪦 묘비 등록: 과거 연인 정보 + 생년월일 + 카톡 파일 업로드",
      "🔮 만세력 계산: 사주팔자 자동 계산 (천간지지/오행)",
      "💫 궁합 분석: 10가지 항목 기반 궁합 점수",
      "💬 카톡 분석: 대화 주제 분류, 감정 온도, 응답 패턴",
      "🤖 AI 해설: GPT-4.1 기반 만세력 해석 + 연애 조언",
      "⚖️ 비교 분석: 두 과거 연인 비교",
    ],
  },
]

export default function NoticePage() {
  const [expanded, setExpanded] = useState<string | null>(NOTICES[0]?.version || null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-gothic text-3xl font-bold text-cemetery-heading">📢 공지사항</h1>
        <p className="text-xs text-cemetery-ghost/40">명예의전당 기능 업데이트 및 변경 이력</p>
      </div>

      {/* 튜토리얼 다시 보기 */}
      <button
        onClick={() => { localStorage.removeItem("tutorial-done"); window.dispatchEvent(new Event("show-tutorial")) }}
        className="w-full py-3 bg-cemetery-card border border-dashed border-cemetery-accent/30 hover:border-cemetery-accent
          rounded-2xl text-sm text-cemetery-accent transition-colors cute-press"
      >
        📖 튜토리얼 다시 보기
      </button>

      {/* 기능 가이드 */}
      <div className="bg-cemetery-card border border-cemetery-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-cemetery-heading">🗺️ 기능 가이드</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <GuideItem href="/grave" icon="🪦" title="묘지 관리" desc="과거 연애를 묘비로 등록" />
          <GuideItem href="/manseryeok" icon="🔮" title="만세력" desc="생년월일로 사주팔자 계산" />
          <GuideItem href="/compare" icon="⚖️" title="비교 분석" desc="두 묘비 비교 분석" />
          <GuideItem href="/love" icon="💘" title="살랑살랑" desc="현재 썸/연애 상대 분석" />
          <GuideItem href="/partner" icon="💀" title="영혼의동반자" desc="서로의 묘비 열람 + 조언" />
          <GuideItem href="/community" icon="👻" title="커뮤니티" desc="연애토크/사주해석/고민상담" />
          <GuideItem href="/community/match" icon="💕" title="궁합 매칭" desc="사주 기반 유저 매칭" />
          <GuideItem href="/ssum" icon="💔" title="썸붕 분석" desc="썸이 왜 깨졌는지 객관적 분석" />
          <GuideItem href="/counsel" icon="🧙" title="연애 상담" desc="AI 전문 상담사에게 맞춤 상담" />
          <GuideItem href="/shop" icon="🛒" title="상점" desc="픽셀아트 아이템 구매" />
          <GuideItem href="/stats" icon="📊" title="통계" desc="랭킹/MBTI/일주 통계" />
        </div>
      </div>

      {/* 업데이트 이력 */}
      <div className="space-y-3">
        {NOTICES.map((notice) => {
          const typeStyle = TYPE_STYLE[notice.type]
          const isOpen = expanded === notice.version
          return (
            <div key={notice.version} className="bg-cemetery-card border border-cemetery-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : notice.version)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-cemetery-surface/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={"text-[10px] px-2 py-0.5 rounded-full border " + typeStyle.bg + " " + typeStyle.color}>
                    {typeStyle.label}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cemetery-heading">{notice.title}</p>
                    <p className="text-[10px] text-cemetery-ghost/30">v{notice.version} · {notice.date}</p>
                  </div>
                </div>
                <span className="text-cemetery-ghost/30 text-xs">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 border-t border-cemetery-border/30 pt-3 space-y-1.5 animate-fade-in">
                  {notice.items.map((item, i) => (
                    <p key={i} className="text-xs text-cemetery-ghost/70 leading-relaxed">{item}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GuideItem({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a href={href} className="flex items-center gap-2 p-2 rounded-xl bg-cemetery-surface hover:bg-cemetery-surface/80 transition-colors">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-cemetery-heading font-semibold">{title}</p>
        <p className="text-[10px] text-cemetery-ghost/40">{desc}</p>
      </div>
    </a>
  )
}
