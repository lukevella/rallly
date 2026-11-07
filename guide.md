# Rallly QA Demo 가이드

본 문서는 프로젝트 (Web demo)의 기능, DB, 라이브러리, 외부 서비스를 정리한다.
기준 버전: Rallly 4.16.1 (`package.json`). 기준일: 2026-11-08.
보안 정보 (비밀번호, 키, 토큰)는 본 문서에 쓰지 않는다.

## 1. 프로젝트 개요

- Rallly는 회의 일정 조율 앱이다.
- 사용자가 Poll (투표)을 만들고, 참가자가 가능한 시간에 투표한다.
- 최적 시간이 정해지면 Event (확정 일정)로 바꾼다.
- 배포 모드는 두 가지다: Cloud-hosted (Stripe 결제, Vercel)와 Self-hosted (Docker, 결제 없음).
- 모드는 `NEXT_PUBLIC_SELF_HOSTED` 환경변수로 전환한다.

## 2. 주요 기능

위치는 `apps/web/src/features/` 아래 폴더 기준이다.

| 기능 | 폴더 | 설명 |
| --- | --- | --- |
| Poll | `poll` | 투표 생성, 옵션 (날짜/시간), 참가자 투표, 댓글, 마감 |
| Quick Create | `quick-create` | 빠른 Poll 생성 |
| Scheduled Event | `scheduled-event` | 확정된 일정, 초대, 일정 변경 |
| Event Types | `event-types` | 예약 가능한 일정 유형 |
| Space | `space` | 팀 워크스페이스, 멤버, 역할 (admin/member), 등급 (free/pro) |
| 인증 | `auth`, `credentials` | 이메일 OTP, 비밀번호, Google, Microsoft, OIDC, 게스트 |
| 사용자 | `user` | 프로필, 계정 삭제 |
| 달력 연동 | `calendars` | Google/Microsoft 달력 연결 |
| 화상회의 연동 | `conferencing` | Google Meet, Zoom, Microsoft Teams, Webex |
| 알림 | `notifications`, `email-queue`, `email-budget` | 이메일 알림, 발송 큐, 발송량 제한 |
| Webhook | `webhook` | 외부 시스템에 이벤트 전달 |
| API Key | `api-keys` | 공개 API (`/api/v1`) 인증 |
| 결제 | `billing`, `licensing` | Stripe 구독, 자체 호스팅 라이선스 |
| 관리 | `instance-settings`, `instance-policy`, `moderation` | 인스턴스 설정, 정책, 신고 처리 |
| 기타 | `activity`, `branding`, `feedback`, `location`, `navigation`, `review-request` | 활동 기록, 브랜딩, 피드백, 장소, 메뉴, 리뷰 요청 |

부가 기능:
- 다국어 (i18next, Crowdin으로 번역 관리).
- 명령 메뉴에서 Poll, Event, 멤버 검색.
- ICS 파일 내보내기, CSV 내보내기.
- OG 이미지 생성 (`/api/og-image-poll`).
- 시간대 처리 (`Intl` 기반, `lib/datetime/`).

## 3. 기술 스택

- 프레임워크: Next.js 16, React 19, TypeScript.
- API: tRPC (조회 전용, 레거시), Server Actions (쓰기), Hono (공개 REST API `/api/v1`, OpenAPI 문서).
- 인증: Better-Auth.
- 권한: CASL.
- 스타일: TailwindCSS 4, Base UI (`packages/ui`), lucide-react 아이콘.
- 폼/검증: react-hook-form, Zod.
- 상태: TanStack Query (서버), Zustand와 React Context (클라이언트).
- 비동기 제어: Effect 4 (일부 mutation).
- 패키지 관리: pnpm 모노레포 + Turborepo. Node 24.
- 코드 품질: Biome (포맷/린트), Oxlint, TypeScript, Husky + lint-staged.
- 테스트: Vitest (단위), Playwright (통합, `apps/web/tests/`), axe-core (접근성).

## 4. 모노레포 구조

| 경로 | 역할 |
| --- | --- |
| `apps/web` | 메인 웹 앱 |
| `apps/landing` | 마케팅 페이지 |
| `apps/docs` | 문서 사이트 (Mintlify) |
| `packages/database` | Prisma 스키마와 클라이언트 |
| `packages/ui` | 공용 UI 컴포넌트 |
| `packages/emails` | 이메일 템플릿 |
| `packages/billing` | Stripe 연동 |
| `packages/posthog` | 분석 클라이언트 |
| `packages/logger` | 공용 로거 |
| `packages/utils`, `languages` | 유틸, 지원 언어 목록 |
| `packages/test-helpers`, `screenshots` | 테스트 도구, 스크린샷 캡처 |
| `packages/tailwind-config`, `tsconfig` | 공용 설정 |

## 5. 데이터베이스

### 5.1 DB 종류

- **PostgreSQL**을 사용한다. (docker 이미지: `postgres:18-alpine`)
- ORM은 **Prisma 7**이다. 드라이버는 `pg` + `@prisma/adapter-pg`이다.
- 스키마는 `packages/database/prisma/models/*.prisma` 13개 파일로 나뉜다.
- 로컬 개발용 DB 포트는 호스트 `5450`이다. (`docker-compose.dev.yml`)
- 접속 문자열은 `DATABASE_URL` 환경변수로 준다.

### 5.2 주요 모델

| 파일 | 모델 |
| --- | --- |
| `user.prisma` | User, Account, Session, Verification |
| `poll.prisma` | Poll, Option, Participant, Vote, Comment, PollInvite, PollActivity |
| `event.prisma` | ScheduledEvent, ScheduledEventInvite, RescheduledEventDate |
| `event-type.prisma` | EventType |
| `space.prisma` | Space, SpaceMember, SpaceMemberInvite, SpaceApiKey, SpaceWebhook, WebhookDelivery |
| `billing.prisma` | Subscription, PaymentMethod, NonprofitApplication |
| `integrations.prisma` | Credential, CalendarConnection, ProviderCalendar, ConferencingConnection |
| `licensing.prisma` | License, LicenseValidation, InstanceLicense |
| `registered-instance.prisma` | RegisteredInstance |
| `instance-settings.prisma` | InstanceSettings |
| `email-queue.prisma` | QueuedEmail |
| `notification.prisma` | UserNotificationPreferences |
| `sheet.prisma` | Sheet, SheetSlot |

### 5.3 DB 명령

```bash
pnpm db:generate   # Prisma 클라이언트 생성
pnpm docker:up     # 개발용 컨테이너 시작
pnpm db:reset      # DB 초기화 + 시드 데이터
pnpm db:migrate    # 마이그레이션 (개발)
pnpm db:deploy     # 마이그레이션 (운영)
```

## 6. 보조 인프라 (개발용 Docker)

`docker-compose.dev.yml`이 아래 서비스를 시작한다.

| 서비스 | 이미지 | 호스트 포트 | 용도 |
| --- | --- | --- | --- |
| PostgreSQL | `postgres:18-alpine` | 5450 | 메인 DB |
| Redis | `redis:7.4-alpine` | 6379 | Rate limit 저장소 |
| serverless-redis-http | `hiett/serverless-redis-http` | 8079 | Redis를 REST로 노출 (Upstash 호환) |
| Garage | `dxflrs/garage` | 3900, 3903 | S3 호환 객체 저장소 (로컬) |
| Mailpit | `axllent/mailpit` | 8025 (웹), 1025 (SMTP) | 개발용 메일 수신함 |

참고:
- Redis와 객체 저장소는 선택 사항이다. Redis 변수가 없으면 rate limit이 꺼진다.
- `docker-compose.yml`은 Self-hosted 용이다. 앱과 PostgreSQL만 포함한다.

## 7. 외부 서비스 (서드파티)

| 분류 | 서비스 | 필수 여부 |
| --- | --- | --- |
| 이메일 | SMTP 서버 (nodemailer). 개발 시 Mailpit | 이메일 발송에 필요 |
| 객체 저장소 | S3 호환 (AWS SDK). 개발 시 Garage | 선택 |
| Rate limit | Upstash Redis (REST) | 선택 |
| 로그인 | Google, Microsoft, OIDC | 선택 |
| 달력 | Google Calendar API, Microsoft 달력 | 선택 |
| 화상회의 | Google Meet, Zoom, Microsoft Teams, Webex | 선택 |
| 결제 | Stripe | Cloud 모드만 |
| 분석 | PostHog | 선택 |
| 오류 추적 | Sentry | 선택 |
| 봇 방지 | Cloudflare Turnstile | 선택 |
| AI | OpenAI (Vercel AI SDK) | 선택 |
| 번역 | Crowdin | 개발 과정만 |
| 배포 | Vercel (Cloud), Docker (Self-hosted) | 선택 |

## 8. 주요 라이브러리

`apps/web/package.json` 기준이다.

- **UI/스타일**: react, next, tailwindcss, class-variance-authority, motion, lucide-react, react-image-crop.
- **데이터/API**: @trpc/*, @tanstack/react-query, @tanstack/react-table, hono, hono-openapi, @scalar/hono-api-reference, superjson, next-safe-action.
- **DB**: @prisma/client, @prisma/adapter-pg, pg.
- **인증/권한**: better-auth, iron-session, @casl/ability, @casl/prisma, zxcvbn (비밀번호 강도).
- **폼/검증**: react-hook-form, @hookform/resolvers, zod.
- **날짜/시간**: `Intl` 래퍼 (`lib/datetime/`), dayjs (레거시, 신규 사용 금지), ics, calendar-link.
- **i18n**: i18next, react-i18next, i18next-icu, intl-messageformat.
- **이메일**: @react-email/components, @react-email/render, nodemailer (`packages/emails`).
- **외부 SDK**: @aws-sdk/client-s3, @googleapis/calendar, @googleapis/meet, @upstash/redis, @upstash/ratelimit, @sentry/nextjs, @marsidev/react-turnstile, ai + @ai-sdk/openai.
- **기타**: effect, zustand, nanoid, es-toolkit, tldts, undici, @t3-oss/env-nextjs (환경변수 검증).

## 9. 로컬 실행 순서

앱은 Docker Compose 컨테이너로만 실행한다. `next dev`와 portless는 쓰지 않는다. (핫 리로드는 나중에 재검토한다.)

```bash
cp apps/web/.env.sample apps/web/.env
docker compose -f docker-compose.dev.yml -f docker-compose.local.yml up -d --build
```

- 접속 주소는 `http://localhost:7201`이다.
- 메일은 Mailpit (`http://localhost:8025`)에서 본다.
- `.env`의 필수 값 (예: `SECRET_PASSWORD`, 32자 이상)은 사용자가 직접 채운다. 값은 문서나 Git에 올리지 않는다.
- `NEXT_PUBLIC_BASE_URL`은 `http://localhost:7201`로 맞춘다.
- 앱 이미지는 Self-hosted 모드로 빌드한다. Dockerfile이 그 모드에서만 동작한다.
- 앱 시작 시 DB 마이그레이션이 자동으로 적용된다.
- Windows에서는 Docker Desktop이 필요하다.
- 셸 스크립트 (`*.sh`)는 LF 줄바꿈이어야 한다. `.gitattributes`가 이를 고정한다.
- 변경 내역: 원본의 `pnpm dev`와 portless 관련 스크립트는 삭제했다.

## 10. LLMS.md 연계

- To-do 1: Chrome으로 Web demo를 실행한다. → 9장 순서를 따른다.
- To-do 2: PostgreSQL을 로컬에 구현한다. → 5장과 6장을 참고한다. 프로젝트 기본 방식은 Docker이다. 비 Docker 설치는 사용자가 선택한다.
