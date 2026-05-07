# 명예의전당 개발 규칙

## 배포 전 QA 체크리스트
- [ ] `npx next build` 성공 (타입 에러 없음)
- [ ] Chrome + Safari 호환 확인
- [ ] `crypto.randomUUID()` 사용 금지 → `Math.random().toString(36)` 사용
- [ ] `showPicker()` 사용 금지
- [ ] 모든 API에 서버 인증 (`auth()`) 확인
- [ ] GPT 호출 API에는 반드시 로그인 필수
- [ ] `.env.local`이 git에 포함되지 않는지 확인
- [ ] 공지사항 NOTICES 배열 업데이트
- [ ] 모바일 반응형 깨지지 않는지 확인

## 배포 명령어
```bash
# 빌드 + GitHub + Vercel
rm -rf .next && npx next build && git add -A && git commit -m "설명" && git push && npx --cache /tmp/npm-cache vercel --prod --yes

# 내부망 서버 (.env.local 제외!)
tar --exclude='node_modules' --exclude='.next' --exclude='.vercel' --exclude='.DS_Store' --exclude='.env.local' --exclude='.git' -czf /tmp/lc.tar.gz .
sshpass -p 'apdldkdlroqkf1@' scp -o StrictHostKeyChecking=no -P 18181 /tmp/lc.tar.gz brain@10.12.14.180:/home/brain/love-cemetery/
```

## 크로스 브라우저 규칙
- `crypto.randomUUID()` → `Math.random().toString(36).slice(2) + Date.now().toString(36)`
- `btoa()` 서버 → `Buffer.from()` 사용
- `input.showPicker()` 사용 금지
- CSS `color-scheme: dark` 필요
- `touch-action: none` 드래그 요소에 필수

## AI 비용 최적화
- heavy (만세력/궁합): gpt-4.1-mini
- medium (상담/분석): gpt-4.1-mini
- light (채팅): gpt-4.1-nano
- 모든 AI 호출은 AiLog에 자동 저장

## 공지사항 규칙
- 기능 추가/버그 수정 배포 시 `src/app/notice/page.tsx`의 NOTICES 배열 맨 앞에 항목 추가
- version: 시맨틱 버전, date: YYYY-MM-DD, type: feature/fix/improve
