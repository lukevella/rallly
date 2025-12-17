# Data Model: Poll Deadline Enforcement

**Date**: 2025-01-17  
**Feature**: Poll Deadline Enforcement

## Entities

### Poll (Existing - Extended)

**Purpose**: Represents a scheduling poll with optional deadline field

**Fields**:
- `deadline` (DateTime?, nullable): Deadline date/time stored in UTC. When set, the poll will automatically close at this time.

**Relationships**:
- Has many Options (existing)
- Has many Participants (existing)
- Has many Reminders (new, optional)

**Validation Rules**:
- Deadline must be in the future when setting/updating
- Deadline stored in UTC format
- Deadline is optional (nullable)

**State Transitions**:
- When deadline passes and status is 'live' → status changes to 'paused'
- Deadline can be edited/removed if not yet passed
- Deadline becomes read-only after it passes

**Indexes**:
- Consider adding index on `deadline` for efficient cron job queries
- Index: `@@index([deadline])` where deadline IS NOT NULL

### Participant (Existing - Extended)

**Purpose**: Represents a poll participant with optional email address

**Fields**: No new fields required

**Relationships**:
- Belongs to Poll (existing)
- Has many Reminders (new, optional)

**Validation Rules**: Existing validation applies

**Usage for Deadline Feature**:
- Email address used for sending reminder emails
- Check if participant has voted (to exclude from reminders)

### Reminder (New Entity)

**Purpose**: Tracks sent reminder emails to prevent duplicates

**Fields**:
- `id` (String, CUID): Primary key
- `pollId` (String): Foreign key to Poll
- `participantId` (String): Foreign key to Participant
- `reminderType` (Enum): Type of reminder sent ('24h', '6h', '1h')
- `sentAt` (DateTime): When the reminder was sent
- `createdAt` (DateTime): Record creation timestamp

**Relationships**:
- Belongs to Poll
- Belongs to Participant

**Validation Rules**:
- Unique combination of pollId + participantId + reminderType (prevent duplicates)
- sentAt must be in the past

**Indexes**:
- `@@index([pollId, participantId, reminderType])` for duplicate checking
- `@@index([pollId, sentAt])` for querying by poll and time

**Prisma Schema**:

```prisma
enum ReminderType {
  twentyFourHours
  sixHours
  oneHour

  @@map("reminder_type")
}

model Reminder {
  id            String       @id @default(cuid())
  pollId        String       @map("poll_id")
  participantId String       @map("participant_id")
  reminderType  ReminderType @map("reminder_type")
  sentAt        DateTime     @map("sent_at")
  createdAt     DateTime     @default(now()) @map("created_at")

  poll        Poll        @relation(fields: [pollId], references: [id], onDelete: Cascade)
  participant Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@unique([pollId, participantId, reminderType], name: "unique_reminder")
  @@index([pollId, sentAt])
  @@map("reminders")
}
```

**Migration Strategy**: 
- Create Reminder model via Prisma migration
- Add indexes for performance
- Optional: Add index on Poll.deadline for cron job efficiency

## Data Flow

### Setting Deadline

1. User sets deadline in poll creation/editing form
2. Client validates deadline is in future
3. Form submission sends deadline (date/time in user timezone) to tRPC mutation
4. Server validates deadline is in future
5. Server converts deadline to UTC
6. Server stores deadline in Poll.deadline (UTC)
7. Server returns updated poll with deadline

### Checking Deadline Status

1. Poll query loads deadline (UTC) from database
2. Server converts deadline to user's timezone for display
3. Client displays deadline with countdown
4. Client updates countdown every minute

### Deadline Enforcement

1. Cron job runs every 15 minutes
2. Query polls where `deadline <= NOW() AND status = 'live' AND deadline IS NOT NULL`
3. Update status to 'paused' for matching polls
4. Log closure events for analytics

### Sending Reminders

1. Cron job runs every hour
2. Query polls with deadlines in next 24h, 6h, 1h windows
3. For each poll, find participants who:
   - Have email addresses
   - Have not voted (no votes in votes table)
   - Have not received reminder for this interval (check Reminder table)
4. Send reminder emails via EmailClient
5. Create Reminder records to track sent emails
6. Handle errors gracefully (log, don't block other reminders)

## Validation Rules Summary

### Deadline Validation

- **Client-side**: Zod schema validates deadline is in future
- **Server-side**: tRPC input validation confirms deadline is in future
- **Database**: Constraint ensures deadline is stored as UTC DateTime
- **Display**: Convert UTC to user timezone for display

### Reminder Validation

- **Uniqueness**: Prevent duplicate reminders via unique constraint (pollId + participantId + reminderType)
- **Timing**: Only send reminders before deadline passes
- **Recipients**: Only send to participants with valid email addresses who haven't voted

## Queries and Performance

### High-Frequency Queries

1. **Poll queries with deadline**: Include deadline in select, convert to user timezone
2. **Deadline enforcement cron**: Query polls with passed deadlines - needs index on deadline
3. **Reminder cron**: Query polls with upcoming deadlines, check Reminder table for sent status

### Optimization Strategies

- Index on `Poll.deadline` for cron job efficiency
- Index on `Reminder(pollId, participantId, reminderType)` for duplicate checking
- Batch processing in cron jobs (process in batches of 100)
- Selective field loading (only load necessary fields for cron jobs)

