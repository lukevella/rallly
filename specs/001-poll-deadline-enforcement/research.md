# Research: Poll Deadline Enforcement

**Date**: 2025-01-17  
**Feature**: Poll Deadline Enforcement  
**Purpose**: Document technical decisions and patterns for deadline feature implementation

## Technology Decisions

### Date/Time Picker Implementation

**Decision**: Reuse existing date/time picker patterns from poll options form

**Rationale**: The codebase already has date/time picker components used in `poll-options-form/month-calendar/time-picker.tsx` that use dayjs and Select components from Radix UI. This maintains consistency and reduces development time.

**Alternatives considered**: 
- Third-party date picker library (rejected: adds dependency, existing patterns work well)
- Custom date picker component (rejected: unnecessary complexity, existing solution is adequate)

**Implementation Notes**: 
- Use dayjs for all date/time operations (constitution requirement)
- Follow existing TimePicker pattern using Select component
- Support timezone selection similar to poll timezone handling

### Cron Job Implementation Pattern

**Decision**: Follow existing house-keeping cron job pattern using Hono routes

**Rationale**: The codebase already has cron jobs implemented in `/api/house-keeping/[...method]/route.ts` using Hono framework with bearer auth. This pattern is proven, secure, and consistent with existing code.

**Alternatives considered**:
- Separate cron service (rejected: adds complexity, existing pattern works for Vercel)
- Background job queue (rejected: overkill for simple scheduled tasks, cron pattern sufficient)

**Implementation Notes**:
- Use Hono router pattern with bearer auth via CRON_SECRET
- Configure in vercel.json crons section
- Batch processing for efficiency (follow existing BATCH_SIZE pattern)
- Deadline enforcement: Run every 15 minutes
- Reminder emails: Run every hour

### Reminder Email Tracking

**Decision**: Track sent reminders in database to prevent duplicates

**Rationale**: Need to track which participants received reminders at which intervals to prevent duplicate emails. Database tracking provides durability and queryability.

**Alternatives considered**:
- In-memory tracking (rejected: not durable, lost on server restart)
- External cache/Redis (rejected: unnecessary complexity, database is sufficient)
- No tracking (rejected: would cause duplicate emails on retries)

**Implementation Notes**:
- Create Reminder model in Prisma schema
- Track: pollId, participantId, reminderType (24h, 6h, 1h), sentAt
- Query before sending to check if reminder already sent
- Cleanup old reminders periodically (optional optimization)

### Deadline Status Check on Poll Load

**Decision**: Check deadline status synchronously when polls are loaded

**Rationale**: Provides immediate feedback if cron job missed a poll closure. Simple synchronous check during poll query is fast and ensures correctness.

**Alternatives considered**:
- Async background check (rejected: adds complexity, sync check is fast enough)
- Only rely on cron job (rejected: could miss edge cases, sync check is safety net)

**Implementation Notes**:
- Check in tRPC poll.get query
- If deadline passed and status is 'live', update to 'paused' immediately
- Log when this happens for monitoring

### Countdown Real-time Updates

**Decision**: Client-side JavaScript updates countdown every minute

**Rationale**: Server-side updates would require WebSockets or polling, adding complexity. Client-side updates are simple, performant, and sufficient for countdown display.

**Alternatives considered**:
- WebSocket updates (rejected: overkill, adds infrastructure complexity)
- Server-side rendering only (rejected: doesn't update in real-time, poor UX)

**Implementation Notes**:
- Use React.useEffect with setInterval
- Update every 60 seconds (minute granularity is sufficient)
- Cleanup interval on unmount
- Handle timezone changes gracefully

### Deadline Display Styling Thresholds

**Decision**: Use 24 hours and 6 hours as styling thresholds

**Rationale**: Provides clear visual feedback as deadline approaches without too many threshold changes. Standard time intervals that users understand intuitively.

**Alternatives considered**:
- More granular thresholds (e.g., 48h, 24h, 12h, 6h, 1h) (rejected: too many color changes, confusing)
- Single threshold (rejected: less informative, poor UX)

**Implementation Notes**:
- >24h: Neutral (default styling)
- <24h: Warning (yellow/orange)
- <6h: Urgent (red)
- Passed: Disabled (gray)

### Poll Status for Closed Polls

**Decision**: Use existing 'paused' status for deadline-closed polls

**Rationale**: The PollStatus enum already has 'paused' status. Reusing it avoids schema changes and maintains consistency. Deadline closure is essentially pausing the poll.

**Alternatives considered**:
- New 'closed' status (rejected: requires schema migration, 'paused' is semantically appropriate)
- Keep as 'live' with separate deadline flag (rejected: confusing, status should reflect reality)

**Implementation Notes**:
- Update poll.status to 'paused' when deadline passes
- Existing paused poll handling applies
- Can distinguish in UI if needed (e.g., show "Closed at deadline" vs "Paused by creator")

## Integration Points

### Existing Email Template Pattern

**Pattern**: React Email templates in `packages/emails/src/templates/` with i18n support

**Decision**: Create DeadlineReminderEmail template following existing patterns

**Implementation Notes**:
- Use React Email component structure
- Include i18n support via ctx parameter
- Follow existing template structure (Heading, Text, Card, Section)
- Add to templates.ts export

### Existing Form Validation Pattern

**Pattern**: Zod schemas with react-hook-form, validated in tRPC routers

**Decision**: Add deadline validation to existing poll creation/update schemas

**Implementation Notes**:
- Validate deadline is in future using Zod custom refinement
- Validate deadline respects poll timezone
- Optional field (nullable)
- Client-side and server-side validation

### Existing Poll Query Pattern

**Pattern**: tRPC queries with Prisma select for efficient loading

**Decision**: Include deadline in existing poll queries

**Implementation Notes**:
- Add deadline to poll.get query select
- Include deadline in poll list queries
- Format deadline for display in queries (UTC to user timezone)

## Dependencies Confirmed

✅ Deadline field exists in Poll model (DateTime?, nullable)  
✅ Email infrastructure (EmailClient, templates, queue system)  
✅ Cron job infrastructure (Hono routes, Vercel cron config)  
✅ Timezone handling (dayjs with timezone support)  
✅ Date/time picker components (existing patterns)  
✅ Form validation (Zod + react-hook-form)  
✅ Poll status enum includes 'paused'

## Unresolved Items

None - all technical decisions made based on existing codebase patterns and requirements.

