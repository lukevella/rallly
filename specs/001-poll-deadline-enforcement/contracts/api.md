# API Contracts: Poll Deadline Enforcement

**Date**: 2025-01-17  
**Feature**: Poll Deadline Enforcement  
**API Type**: tRPC (Type-safe RPC)

## Modified Endpoints

### polls.create

**Type**: Mutation  
**Location**: `apps/web/src/trpc/routers/polls.ts`

**Changes**: Add optional `deadline` parameter

**Input Schema** (Zod):
```typescript
z.object({
  // ... existing fields
  deadline: z.date().optional().refine(
    (date) => !date || date > new Date(),
    { message: "Deadline must be in the future" }
  ),
})
```

**Behavior**:
- Accept optional deadline (DateTime in user timezone)
- Validate deadline is in future
- Convert deadline to UTC before storing
- Store in Poll.deadline field

**Response**: Poll object with deadline included

---

### polls.update

**Type**: Mutation  
**Location**: `apps/web/src/trpc/routers/polls.ts`

**Changes**: Add optional `deadline` parameter with validation

**Input Schema** (Zod):
```typescript
z.object({
  pollId: z.string(),
  // ... existing fields
  deadline: z.date().nullable().optional().refine(
    (date) => {
      if (date === null) return true; // Can remove deadline
      return date > new Date(); // Or must be in future
    },
    { message: "Deadline must be in the future" }
  ),
})
```

**Validation Rules**:
- If deadline exists and hasn't passed, allow update
- If deadline has passed, return error (cannot edit passed deadline)
- Allow setting deadline to null (remove deadline)

**Behavior**:
- Check if existing deadline has passed
- If passed, reject update with clear error message
- If not passed or null, allow update
- Convert deadline to UTC before storing

**Response**: Updated poll object

---

### polls.get

**Type**: Query  
**Location**: `apps/web/src/trpc/routers/polls.ts`

**Changes**: Include deadline in select, check deadline status

**Select Fields**:
- Add `deadline` to select statement

**Behavior**:
- Load deadline from database (UTC)
- If deadline passed and status is 'live', update status to 'paused'
- Return deadline in response
- Format deadline for display (convert to user timezone if needed)

**Response**: Poll object including deadline field

---

## New Endpoints

### polls.closeExpiredPolls (Internal - Cron Job)

**Type**: Mutation/Query (via cron endpoint)  
**Location**: `apps/web/src/app/api/house-keeping/[...method]/route.ts`

**Endpoint**: `GET /api/house-keeping/close-expired-polls`

**Authentication**: Bearer token (CRON_SECRET)

**Behavior**:
- Query polls where `deadline <= NOW() AND status = 'live' AND deadline IS NOT NULL`
- Update status to 'paused' for matching polls
- Process in batches (BATCH_SIZE = 100)
- Return summary of closed polls count

**Response**:
```typescript
{
  success: boolean;
  summary: {
    closedCount: number;
  };
}
```

---

### polls.sendReminderEmails (Internal - Cron Job)

**Type**: Mutation/Query (via cron endpoint)  
**Location**: `apps/web/src/app/api/house-keeping/[...method]/route.ts`

**Endpoint**: `GET /api/house-keeping/send-reminder-emails`

**Authentication**: Bearer token (CRON_SECRET)

**Behavior**:
- Find polls with deadlines in windows: 24h-23h, 6h-5h, 1h-0h before deadline
- For each poll, find participants who:
  - Have email addresses
  - Have not voted (no votes)
  - Have not received reminder for this interval (check Reminder table)
- Send reminder emails via EmailClient
- Create Reminder records
- Process in batches
- Return summary of sent reminders

**Response**:
```typescript
{
  success: boolean;
  summary: {
    remindersSent: number;
    pollsProcessed: number;
  };
}
```

---

## Cron Job Configuration

**File**: `apps/web/vercel.json`

**Add to crons array**:
```json
{
  "path": "/api/house-keeping/close-expired-polls",
  "schedule": "*/15 * * * *"
},
{
  "path": "/api/house-keeping/send-reminder-emails",
  "schedule": "0 * * * *"
}
```

**Schedules**:
- `close-expired-polls`: Every 15 minutes (`*/15 * * * *`)
- `send-reminder-emails`: Every hour (`0 * * * *`)

---

## Error Responses

### Deadline Validation Errors

**Error Code**: `BAD_REQUEST`

**Messages**:
- "Deadline must be in the future"
- "Cannot edit deadline after it has passed"
- "Invalid deadline format"

### Deadline Enforcement Errors

**Error Code**: `INTERNAL_SERVER_ERROR`

**Messages**:
- Logged but not exposed to users (cron jobs)
- Sentry tracking for monitoring

---

## Type Definitions

### Poll with Deadline

```typescript
type Poll = {
  // ... existing fields
  deadline: Date | null; // UTC date/time
}
```

### Reminder Types

```typescript
enum ReminderType {
  twentyFourHours = "twentyFourHours",
  sixHours = "sixHours",
  oneHour = "oneHour"
}
```

### Deadline Display Data

```typescript
type DeadlineDisplay = {
  deadline: Date | null;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  } | null;
  status: "upcoming" | "warning" | "urgent" | "passed";
  formatted: string; // Formatted for display in user timezone
}
```

