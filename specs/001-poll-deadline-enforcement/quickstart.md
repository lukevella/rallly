# Quick Start: Poll Deadline Enforcement

**Date**: 2025-01-17  
**Feature**: Poll Deadline Enforcement

This guide provides a quick reference for developers implementing the poll deadline enforcement feature.

## Feature Overview

Polls can now have optional deadlines. When a deadline is set:
- Deadline is displayed prominently with real-time countdown
- Poll automatically closes when deadline passes
- Reminder emails are sent to non-responders before deadline
- Participants cannot vote after deadline passes

## Implementation Checklist

### Phase 1: Core Deadline Functionality (P1)

- [ ] Add deadline field to poll creation form
- [ ] Add deadline validation (must be in future)
- [ ] Store deadline in database (UTC conversion)
- [ ] Display deadline on poll pages
- [ ] Implement countdown component with real-time updates
- [ ] Add styling based on time remaining

### Phase 2: Automatic Closure (P2)

- [ ] Implement deadline enforcement cron job
- [ ] Add deadline status check on poll load
- [ ] Prevent voting after deadline passes
- [ ] Update poll status to 'paused' when deadline passes

### Phase 3: Deadline Editing (P2)

- [ ] Add deadline field to poll editing form
- [ ] Validate deadline can only be edited if not passed
- [ ] Allow removing deadline (set to null)

### Phase 4: Reminder Emails (P3)

- [ ] Create Reminder model in Prisma schema
- [ ] Create DeadlineReminderEmail template
- [ ] Implement reminder email cron job
- [ ] Track sent reminders to prevent duplicates

## Key Files to Modify

### Forms

- `apps/web/src/components/forms/poll-details-form.tsx` - Add deadline field
- `apps/web/src/components/forms/poll-settings.tsx` - Alternative location for deadline

### Components

- `apps/web/src/components/poll/deadline-countdown.tsx` - New: Countdown component
- `apps/web/src/components/deadline-display.tsx` - New: Deadline display component
- `apps/web/src/app/[locale]/(optional-space)/poll/[urlId]/page.tsx` - Add deadline display

### API/Routers

- `apps/web/src/trpc/routers/polls.ts` - Add deadline to create/update mutations
- `apps/web/src/app/api/house-keeping/[...method]/route.ts` - Add cron jobs

### Database

- `packages/database/prisma/models/poll.prisma` - Deadline field exists, may add index
- `packages/database/prisma/models/reminder.prisma` - New: Reminder model (if needed)

### Email Templates

- `packages/emails/src/templates/deadline-reminder.tsx` - New: Reminder email template
- `packages/emails/src/templates.ts` - Add DeadlineReminderEmail export

### Cron Configuration

- `apps/web/vercel.json` - Add cron job schedules

## Development Workflow

1. **Start with P1 features** (deadline setting and display)
2. **Test deadline display** with various time ranges
3. **Implement auto-closure** (P2)
4. **Add deadline editing** (P2)
5. **Implement reminders** (P3)

## Testing Strategy

### Unit Tests (Vitest)

- Deadline validation logic
- Timezone conversion utilities
- Countdown calculation functions
- Deadline status determination

### Integration Tests (Playwright)

- Setting deadline when creating poll
- Viewing deadline on poll page
- Countdown updates correctly
- Voting blocked after deadline
- Deadline editing restrictions
- Reminder emails sent correctly

## Common Patterns

### Date/Time Handling

```typescript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Convert user input to UTC for storage
const deadlineUTC = dayjs(deadline).utc().toDate();

// Convert UTC to user timezone for display
const deadlineDisplay = dayjs(deadlineUTC)
  .tz(userTimeZone)
  .format("YYYY-MM-DD HH:mm z");
```

### Deadline Validation

```typescript
const deadlineSchema = z.date().optional().refine(
  (date) => !date || date > new Date(),
  { message: "Deadline must be in the future" }
);
```

### Countdown Calculation

```typescript
const getTimeRemaining = (deadline: Date) => {
  const now = dayjs();
  const end = dayjs(deadline);
  const diff = end.diff(now);
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
};
```

### Deadline Styling Logic

```typescript
const getDeadlineStatus = (deadline: Date) => {
  const now = dayjs();
  const end = dayjs(deadline);
  const hoursRemaining = end.diff(now, "hour");
  
  if (end.isBefore(now)) return "passed";
  if (hoursRemaining < 6) return "urgent";
  if (hoursRemaining < 24) return "warning";
  return "upcoming";
};
```

## i18n Keys Needed

Add translation keys (will be auto-scanned):

- `deadline`
- `deadlineLabel`
- `deadlinePlaceholder`
- `deadlineValidationFuture`
- `deadlinePassed`
- `deadlineRemaining`
- `deadlineClosedAt`
- `reminderEmailSubject`
- `reminderEmailContent`

Use `i18n:scan` command to generate translation files.

## Database Migration

1. Run Prisma migration to add Reminder model (if needed)
2. Add index on Poll.deadline for performance
3. Test migration on development database

```bash
pnpm db:migrate
```

## Deployment Checklist

- [ ] Database migration applied
- [ ] Cron jobs configured in vercel.json
- [ ] CRON_SECRET environment variable set
- [ ] Email templates deployed
- [ ] Integration tests passing
- [ ] Performance tests (cron jobs complete within time limits)

## Monitoring

- Monitor deadline enforcement job execution time
- Track reminder email delivery rates
- Monitor for missed deadline closures (check logs)
- Track reminder email bounce rates

## Troubleshooting

**Issue**: Deadlines not closing automatically
- Check cron job is running (Vercel logs)
- Verify CRON_SECRET is set
- Check database for polls with passed deadlines still in 'live' status

**Issue**: Reminder emails not sending
- Check email configuration (SMTP/SES)
- Verify participant email addresses are valid
- Check Reminder table for duplicate prevention
- Review cron job logs

**Issue**: Countdown not updating
- Verify client-side JavaScript is working
- Check timezone conversions
- Verify dayjs plugins are loaded

