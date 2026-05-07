# 명예의전당 (Love Cemetery) 👻

> 지난 연애를 기리고, 새로운 사랑을 준비하는 공간

[![Deploy](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://love-cemetery.vercel.app)

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🪦 **묘지 관리** | 과거 연인을 등급별(현충원/공동묘지/수장) 묘비로 등록 |
| 🔮 **종합 운명 분석** | 사주명리·자미두수·수비학·점성학·구성기학·수리성명학 6학문 교차검증 |
| 💘 **살랑살랑** | 현재 썸/연애 상대 궁합 분석 + 과거 연애 비교 |
| 💔 **썸붕 분석실** | 썸이 깨진 이유 객관 분석 + 팩폭 레벨 조절 (🧸~💀) |
| 🧙 **연애 상담소** | AI 전문 상담사 맞춤 상담 (하루 3회 무료) |
| 👻 **커뮤니티** | 연애토크/사주해석/고민상담/궁합추천 게시판 |
| 💀 **영혼의동반자** | 서로 묘비 열람 + 향피우기(🪔) + 코멘트 |
| 📊 **통계/랭킹** | 묘비 수 TOP 50, MBTI별/일주별 연애 패턴 |
| 🛒 **추모 상점** | 픽셀아트 아이템 구매 + 묘비 꾸미기 (드래그 배치, 크기 조절) |
| 👻 **AI 채팅** | 과거 연인의 말투를 재현하는 가상 대화 |
| 🎁 **초대 코드** | 친구 초대 시 양쪽 +200코인 |
| 📧 **이메일 비밀번호 재설정** | Gmail SMTP 기반 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | Next.js 15 (App Router) + TypeScript |
| **스타일링** | Tailwind CSS v4 |
| **DB** | MongoDB Atlas (Mongoose) |
| **인증** | NextAuth v5 (Credentials + bcrypt) |
| **AI** | OpenAI GPT-4.1-mini / nano |
| **이메일** | Gmail SMTP (Nodemailer) |
| **배포** | Vercel (Pro) |
| **모바일** | PWA + Capacitor (iOS/Android) |
| **픽셀아트** | SVG 기반 커스텀 렌더러 |

## 프로젝트 구조

```
src/
├── app/
│   ├── api/            # 서버 API 라우트
│   │   ├── data/       # 메인 데이터 (묘비, 코인, 아이템)
│   │   ├── community/  # 커뮤니티 (게시글, 댓글, 매칭)
│   │   ├── partner/    # 영혼의동반자 + 향피우기
│   │   ├── counsel/    # 연애 상담소
│   │   ├── ssum/       # 썸붕 분석
│   │   ├── stats/      # 통계/랭킹
│   │   ├── analyze/    # AI 종합 해설
│   │   ├── manseryeok/ # 만세력 6학문 분석
│   │   ├── love-advice/# 살랑살랑 AI 조언
│   │   ├── chat/       # AI 채팅
│   │   ├── account/    # 회원가입/비밀번호
│   │   └── feedback/   # 피드백
│   ├── grave/          # 묘지 관리 + 상세 + 채팅
│   ├── manseryeok/     # 종합 운명 분석
│   ├── love/           # 살랑살랑
│   ├── ssum/           # 썸붕 분석실
│   ├── counsel/        # 연애 상담소
│   ├── community/      # 커뮤니티 + 궁합매칭
│   ├── partner/        # 영혼의동반자
│   ├── stats/          # 통계/랭킹
│   ├── shop/           # 추모 상점
│   ├── mypage/         # 마이페이지 (코인내역, 통계)
│   ├── invite/         # 초대 코드
│   └── notice/         # 공지사항
├── components/         # 재사용 컴포넌트
├── lib/
│   ├── db/             # MongoDB 모델/연결
│   ├── llm.ts          # OpenAI 호출 (역할별 프롬프트)
│   ├── manseryeok.ts   # 만세력 계산 엔진
│   ├── kakao-parser.ts # 카카오톡 대화 파서
│   ├── mailer.ts       # 이메일 발송
│   ├── auth.ts         # NextAuth 설정
│   └── rate-limit.ts   # 레이트 리미팅
└── types/              # 타입 정의
```

## 환경 변수

```env
OPENAI_API_KEY=         # OpenAI API 키
NEXTAUTH_SECRET=        # NextAuth 시크릿 (openssl rand -base64 32)
NEXTAUTH_URL=           # 사이트 URL
MONGODB_URI=            # MongoDB Atlas 연결 문자열
SMTP_EMAIL=             # Gmail 주소
SMTP_PASSWORD=          # Gmail 앱 비밀번호
APP_URL=                # 앱 URL (이메일 링크용)
```

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 모바일 앱 빌드

```bash
# Capacitor 동기화
npx cap sync

# iOS 빌드 (Mac + Xcode 필요)
npx cap open ios

# Android 빌드 (Android Studio 필요)
npx cap open android
```

## AI 비용 최적화

| 용도 | 모델 | 역할 |
|------|------|------|
| 만세력/궁합 | gpt-4.1-mini | fortune (운명학 전문가) |
| 상담/분석 | gpt-4.1-mini | counselor (현실 연애 조언) |
| AI 채팅 | gpt-4.1-nano | 말투 재현 |

## 보안

- bcrypt 비밀번호 해싱
- 서버사이드 세션 인증 (모든 API)
- 코인 보상 서버에서만 처리
- 레이트 리미팅 (AI API 분당 5~10회)
- 입력값 새니타이징

## 라이선스

Private
