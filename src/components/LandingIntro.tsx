"use client"

import { useEffect, useRef } from "react"

const MOCKUPS = [
  {
    title: "6학문 교차검증 분석",
    emoji: "🔮",
    description: "사주명리학, 자미두수, 수비학, 서양 점성학, 구성기학, 수리성명학.\n\n하나의 관점이 아닌 동서양 6개 학문을 종합하여 연애운, 직업운, 재물운, 건강운까지 심층 분석합니다.\n\n분석 후 추가 질문으로 궁금한 점을 더 깊이 파고들 수 있어요.",
    screen: "fortune",
  },
  {
    title: "과거 연애 & 현재 썸 비교",
    emoji: "💘",
    description: "과거 연인의 정보를 등록하면 10가지 항목으로 궁합을 분석하고, 카카오톡 대화까지 분석해요.\n\n지금 만나는 사람과 과거 연애를 비교 분석하여 같은 실수를 반복하지 않도록 AI가 조언합니다.\n\n궁합 결과를 이미지로 저장해서 SNS에 공유할 수 있어요!",
    screen: "love",
  },
  {
    title: "유령들의 커뮤니티",
    emoji: "👻",
    description: "나만 이런 고민 하는 게 아니에요.\n\n비슷한 사주, 비슷한 경험을 가진 사람들과 연애 토크, 사주 해석, 고민 상담을 나눌 수 있어요.\n\n영혼의동반자를 맺으면 서로의 묘비에 향을 피우고 조언을 남길 수 있습니다.",
    screen: "community",
  },
]

const SIX_STUDIES = [
  { emoji: "☯️", name: "사주명리학", desc: "천간지지 오행 분석" },
  { emoji: "⭐", name: "자미두수", desc: "명반 궁위 분석" },
  { emoji: "🔢", name: "수비학", desc: "생명경로수 분석" },
  { emoji: "♈", name: "서양 점성학", desc: "태양 별자리 분석" },
  { emoji: "🧭", name: "구성기학", desc: "본명성 길방 분석" },
  { emoji: "✍️", name: "수리성명학", desc: "이름 획수 분석" },
]

const FEATURES = [
  { emoji: "🪦", name: "묘비 세우기", desc: "과거 연인 정보 등록 → 궁합, 카톡 분석, AI 해설" },
  { emoji: "💘", name: "살랑살랑", desc: "현재 썸/연애 상대 궁합 + 과거 비교 분석" },
  { emoji: "💔", name: "썸붕 분석", desc: "썸이 깨진 이유를 사주+연애고수가 분석. 팩폭 조절!" },
  { emoji: "🧙", name: "연애 상담", desc: "내 기록 기반 AI 맞춤 상담. 하루 3회 무료." },
  { emoji: "👻", name: "커뮤니티", desc: "연애 토크, 사주 해석, 궁합 매칭까지." },
  { emoji: "💀", name: "영혼의동반자", desc: "서로의 묘비에 향을 피우고 조언을 나눠요." },
]

const REVIEWS = [
  {
    stars: 5,
    quote: "전 애인과의 카톡 대화를 분석했더니 이별 징후가 3개월 전부터 있었더라고요. 다음 연애에서는 이 신호를 놓치지 않겠다고 다짐했어요.",
    tags: ["카톡 분석", "묘비"],
    author: "묘비 2개 세운 유저",
  },
  {
    stars: 5,
    quote: "지금 만나는 사람과 전 애인의 궁합을 비교했더니 확실히 차이가 보였어요. 이번엔 성공적인 연애가 될 거란 확신이 생겼습니다!",
    tags: ["살랑살랑", "비교 분석"],
    author: "살랑살랑 이용자",
  },
  {
    stars: 4,
    quote: "이직을 고민하고 있었는데, 올해 재물운 흐름과 직업 적성을 분석받고 방향이 확실해졌어요. 사주 관점에서 IT 쪽이 맞다고 해서 결심했습니다.",
    tags: ["직업/재물운", "종합 분석"],
    author: "종합 운명 분석 이용자",
  },
  {
    stars: 5,
    quote: "팩폭 레벨 5로 썸붕 분석했더니 '대화할 때 리액션이 없었을 거야'라고 하는데 소름... 인정하기 싫지만 맞는 말이라 고치려고 노력 중이에요.",
    tags: ["썸붕", "팩폭 5"],
    author: "썸붕 분석실 이용자",
  },
  {
    stars: 5,
    quote: "결혼 시기가 궁금했는데, 6학문이 다 2027년 하반기를 가리키더라고요. 교차검증이라 신뢰가 갔어요. 그때까지 자기 발전에 집중하려구요.",
    tags: ["결혼운", "교차검증"],
    author: "만세력 채팅 이용자",
  },
  {
    stars: 5,
    quote: "영혼의동반자가 내 묘비에 '응원의 향'을 피워줬는데 생각보다 힐링이 되더라고요. 혼자 끙끙 앓는 것보다 나누니까 훨씬 나아요.",
    tags: ["동반자", "향피우기"],
    author: "영혼의동반자 유저",
  },
]

function PhoneMockupFortune() {
  return (
    <div className="bg-cemetery-card border-2 border-cemetery-accent/20 rounded-3xl p-4 max-w-[280px] mx-auto shadow-2xl shadow-black/40">
      <div className="bg-cemetery-bg rounded-2xl overflow-hidden">
        <div className="w-20 h-1.5 bg-cemetery-border/50 rounded-full mx-auto mt-2" />
        <div className="p-4 min-h-[320px]">
          <p className="text-sm font-bold text-center text-cemetery-text mb-3">🔮 종합 운명 분석</p>
          <div className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 mb-2">
            <p className="text-[10px] text-cemetery-ghost">사주팔자</p>
            <div className="flex gap-2 mt-1.5">
              {[
                { char: "甲", sub: "寅", color: "text-cemetery-accent bg-cemetery-accent/15" },
                { char: "丙", sub: "午", color: "text-red-400 bg-red-500/10" },
                { char: "戊", sub: "辰", color: "text-yellow-400 bg-yellow-500/10" },
                { char: "壬", sub: "子", color: "text-blue-400 bg-blue-500/10" },
              ].map((p) => (
                <div key={p.char} className={`flex-1 rounded-lg p-1.5 text-center ${p.color}`}>
                  <div className="text-base font-bold">{p.char}</div>
                  <div className="text-[11px] text-cemetery-ghost">{p.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 mb-2 blur-[3px]">
            <p className="text-[10px] text-cemetery-ghost">오행 분포</p>
            <div className="h-1.5 rounded-full mt-1.5 w-[70%] bg-green-500" />
            <div className="h-1.5 rounded-full mt-1 w-[50%] bg-red-500" />
            <div className="h-1.5 rounded-full mt-1 w-[30%] bg-yellow-500" />
          </div>
          <div className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 blur-[3px]">
            <p className="text-[10px] text-cemetery-ghost">🔮 교차검증 종합 결론</p>
            <p className="text-[11px] text-cemetery-ghost/60 mt-1">목 기운이 강하여 성장과 변화를 추구하는...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMockupLove() {
  return (
    <div className="bg-cemetery-card border-2 border-pink-500/20 rounded-3xl p-4 max-w-[280px] mx-auto shadow-2xl shadow-black/40">
      <div className="bg-cemetery-bg rounded-2xl overflow-hidden">
        <div className="w-20 h-1.5 bg-cemetery-border/50 rounded-full mx-auto mt-2" />
        <div className="p-4 min-h-[320px]">
          <p className="text-sm font-bold text-center text-cemetery-text mb-3">💘 궁합 분석</p>
          <div className="text-center py-2">
            <div className="text-5xl font-black text-pink-400">87%</div>
            <div className="text-[11px] text-cemetery-ghost">목(木) ↔ 화(火)</div>
          </div>
          <div className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 mb-2">
            <p className="text-[10px] text-green-400">💚 강점</p>
            <p className="text-[11px] text-cemetery-ghost mt-1">✦ 천간합: 갑기합토 - 신뢰가 깊은 관계</p>
            <p className="text-[11px] text-cemetery-ghost">✦ 음양 조화: 서로 보완</p>
          </div>
          <div className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 mb-2 blur-[3px]">
            <p className="text-[10px] text-red-400">⚡ 주의할 점</p>
            <p className="text-[11px] text-cemetery-ghost mt-1">⚠ 지지충: 인신충 - 주도권 경쟁...</p>
          </div>
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 p-2 bg-cemetery-accent/10 rounded-lg text-center text-[10px] text-cemetery-ghost">📸 이미지 저장</div>
            <div className="flex-1 p-2 bg-cemetery-accent/10 rounded-lg text-center text-[10px] text-cemetery-ghost">🔗 링크 복사</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMockupCommunity() {
  return (
    <div className="bg-cemetery-card border-2 border-purple-500/20 rounded-3xl p-4 max-w-[280px] mx-auto shadow-2xl shadow-black/40">
      <div className="bg-cemetery-bg rounded-2xl overflow-hidden">
        <div className="w-20 h-1.5 bg-cemetery-border/50 rounded-full mx-auto mt-2" />
        <div className="p-4 min-h-[320px]">
          <p className="text-sm font-bold text-center text-cemetery-text mb-3">👻 커뮤니티</p>
          {[
            { tag: "💀 연애토크", tagColor: "bg-cemetery-accent/15 text-cemetery-accent", title: "이별 후 연락 오면 어떻게 해야 할까요", meta: "🪔 12 · 👁️ 48" },
            { tag: "💘 궁합추천", tagColor: "bg-pink-500/15 text-pink-400", title: "ENFP랑 ISTJ 궁합 실제로 어떤가요?", meta: "🪔 8 · 👁️ 31" },
            { tag: "👻 고민상담", tagColor: "bg-green-500/15 text-green-400", title: "3년 사귄 사람인데 결혼 얘기를 안 해요", meta: "🪔 23 · 👁️ 89" },
          ].map((post) => (
            <div key={post.title} className="bg-cemetery-surface border border-cemetery-accent/10 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
              </div>
              <p className="text-[12px] font-bold text-cemetery-text">{post.title}</p>
              <p className="text-[10px] text-cemetery-ghost mt-1">{post.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PHONE_MOCKUPS = [PhoneMockupFortune, PhoneMockupLove, PhoneMockupCommunity]

export function LandingIntro() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0")
            entry.target.classList.remove("opacity-0", "translate-y-10")
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
    sectionRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const addRef = (el: HTMLDivElement | null) => {
    if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el)
  }

  return (
    <div className="space-y-16 -mx-4 sm:-mx-0">
      {/* 히어로 */}
      <section className="text-center py-12 sm:py-20 space-y-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center bottom, rgba(139,123,247,0.08) 0%, transparent 60%)" }} />
        <div className="text-[80px] sm:text-[120px] ghost-float inline-block drop-shadow-[0_0_30px_rgba(139,123,247,0.3)]">
          👻
        </div>
        <h1 className="font-gothic text-3xl sm:text-5xl font-black bg-gradient-to-br from-white to-cemetery-accent bg-clip-text text-transparent leading-tight">
          당신의 연애는<br />왜 죽었을까?
        </h1>
        <p className="text-cemetery-ghost text-sm sm:text-base max-w-md mx-auto px-4 leading-relaxed">
          과거 연애 데이터 기반 종합 운명 분석.<br />
          대운, 연애, 결혼, 재물운까지 6가지 학문으로 심층 분석.
        </p>
        <div className="flex gap-3 justify-center flex-wrap px-4">
          <a href="/login" className="px-6 sm:px-8 py-3 sm:py-4 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-2xl font-bold text-sm sm:text-base transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cemetery-accent/30">
            무료로 시작하기
          </a>
          <a href="#landing-features" className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-cemetery-accent text-cemetery-accent hover:bg-cemetery-accent hover:text-white rounded-2xl font-bold text-sm sm:text-base transition-all">
            기능 둘러보기
          </a>
        </div>
        <div className="text-cemetery-ghost/40 text-xs animate-bounce pt-4">
          ↓ 스크롤하여 더 알아보기
        </div>
      </section>

      {/* 폰 목업 섹션들 */}
      {MOCKUPS.map((mockup, i) => {
        const PhoneMockup = PHONE_MOCKUPS[i]
        const isReversed = i % 2 === 1
        return (
          <div
            key={mockup.title}
            ref={addRef}
            className="opacity-0 translate-y-10 transition-all duration-700 ease-out px-4"
          >
            <div className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 max-w-4xl mx-auto`}>
              <div className="flex-1 min-w-0">
                <PhoneMockup />
              </div>
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-cemetery-heading mb-3">
                  {mockup.emoji} {mockup.title}
                </h3>
                <p className="text-sm text-cemetery-ghost leading-relaxed whitespace-pre-line">
                  {mockup.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* 6학문 */}
      <section ref={addRef} className="opacity-0 translate-y-10 transition-all duration-700 ease-out px-4">
        <h2 className="font-gothic text-2xl sm:text-3xl font-black text-center text-cemetery-heading mb-3">
          🔮 6가지 학문 교차검증
        </h2>
        <p className="text-center text-cemetery-ghost text-sm mb-8 leading-relaxed">
          하나의 관점이 아닌, 동서양 6개 학문을 종합하여<br />가장 신뢰도 높은 분석을 제공합니다.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {SIX_STUDIES.map((s) => (
            <div key={s.name} className="bg-cemetery-surface border border-cemetery-accent/10 rounded-2xl p-4 sm:p-5 text-center transition-all hover:border-cemetery-accent/30 hover:bg-cemetery-card">
              <span className="text-2xl sm:text-3xl block mb-2">{s.emoji}</span>
              <h4 className="text-sm font-bold text-cemetery-heading mb-1">{s.name}</h4>
              <p className="text-[11px] text-cemetery-ghost">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 주요 기능 */}
      <section id="landing-features" ref={addRef} className="opacity-0 translate-y-10 transition-all duration-700 ease-out px-4">
        <h2 className="font-gothic text-2xl sm:text-3xl font-black text-center text-cemetery-heading mb-3">
          🪦 이런 것들을 할 수 있어요
        </h2>
        <p className="text-center text-cemetery-ghost text-sm mb-8">
          연애의 시작부터 끝까지, 그리고 새로운 시작까지
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.name} className="bg-cemetery-card border border-cemetery-accent/15 rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-cemetery-accent/10 hover:border-cemetery-accent/30">
              <span className="text-4xl block mb-3">{f.emoji}</span>
              <h3 className="text-base font-bold text-cemetery-heading mb-2">{f.name}</h3>
              <p className="text-xs text-cemetery-ghost leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 후기 */}
      <section ref={addRef} className="opacity-0 translate-y-10 transition-all duration-700 ease-out px-4">
        <h2 className="font-gothic text-2xl sm:text-3xl font-black text-center text-cemetery-heading mb-3">
          💬 유령들의 이야기
        </h2>
        <p className="text-center text-cemetery-ghost text-sm mb-8">실제 사용자들의 경험담</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {REVIEWS.map((r, i) => (
            <div key={i} className="bg-cemetery-card border border-pink-500/12 rounded-2xl p-5 transition-all hover:border-pink-500/30">
              <div className="text-yellow-500 text-sm mb-2">
                {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
              </div>
              <p className="text-sm text-cemetery-text leading-relaxed mb-3">&ldquo;{r.quote}&rdquo;</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {r.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-cemetery-accent/10 text-cemetery-accent">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-pink-400">— {r.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 sm:py-24 relative px-4">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center bottom, rgba(139,123,247,0.08) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-6xl sm:text-[80px] ghost-float inline-block mb-5">👻</div>
          <h2 className="font-gothic text-2xl sm:text-3xl font-black text-cemetery-heading mb-4">
            당신의 연애도<br />이곳에 묻어보세요
          </h2>
          <p className="text-cemetery-ghost text-sm mb-8">
            가입하면 500코인 + 무료 분석 3회 제공
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/login" className="px-8 py-4 bg-cemetery-accent hover:bg-cemetery-accent-dim rounded-2xl font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cemetery-accent/30">
              무료 회원가입
            </a>
            <a href="/login" className="px-8 py-4 bg-transparent border-2 border-cemetery-accent text-cemetery-accent hover:bg-cemetery-accent hover:text-white rounded-2xl font-bold transition-all">
              로그인
            </a>
          </div>
        </div>
      </section>

      {/* 개인정보 안내 */}
      <section className="text-center pb-8 px-4 space-y-3">
        <div className="max-w-xl mx-auto bg-cemetery-surface/50 border border-cemetery-border/50 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg">🔒</span>
            <h3 className="text-sm font-bold text-cemetery-heading">개인정보 보호 안내</h3>
          </div>
          <p className="text-xs text-cemetery-ghost/80 leading-relaxed">
            명예의전당은 사용자의 개인정보를 소중히 다룹니다.<br />
            생년월일, 이름 등의 정보는 <strong className="text-cemetery-text">분석 목적으로만 사용</strong>되며, 제3자에게 절대 제공되지 않습니다.<br />
            모든 데이터는 <strong className="text-cemetery-text">암호화</strong>되어 안전하게 보관됩니다.<br />
            원하시면 언제든 <strong className="text-cemetery-text">마이페이지에서 계정과 모든 데이터를 삭제</strong>할 수 있습니다.
          </p>
          <p className="text-[10px] text-cemetery-ghost/40 mt-3">
            카카오톡 대화 파일은 서버에 저장되지 않으며, 분석 후 즉시 폐기됩니다.
          </p>
        </div>
        <p className="text-[11px] text-cemetery-ghost/30">
          명예의전당 © 2026 | 유령들의 연애 안식처
        </p>
      </section>
    </div>
  )
}
