# Tasks: Poll Deadline Enforcement

**Input**: Design documents from `/specs/001-poll-deadline-enforcement/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Add database index on Poll.deadline field for cron job performance in `packages/database/prisma/models/poll.prisma`

### QA Testing for Phase 1

- [x] T070 [P] Create Phase 1 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-1-setup.feature`
- [x] T071 Execute Phase 1 QA tests: Verify database index exists on Poll.deadline field and performs efficiently (QA Stop Point - do not proceed to Phase 2 until Phase 1 tests pass)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create Reminder model in `packages/database/prisma/models/reminder.prisma` with fields: id, pollId, participantId, reminderType, sentAt, createdAt
- [x] T003 [P] Add ReminderType enum (twentyFourHours, sixHours, oneHour) to reminder.prisma schema
- [x] T004 Add unique constraint on Reminder (pollId + participantId + reminderType) to prevent duplicate reminders
- [x] T005 Add indexes on Reminder (pollId, participantId, reminderType) and (pollId, sentAt) for query performance
- [x] T006 Run Prisma migration to create Reminder table and update schema
- [x] T007 Update Poll model relations to include Reminder relationship in `packages/database/prisma/models/poll.prisma`
- [x] T008 Update Participant model relations to include Reminder relationship in `packages/database/prisma/models/participant.prisma`

### QA Testing for Phase 2

- [x] T072 [P] Create Phase 2 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-2-foundational.feature`
- [x] T073 Execute Phase 2 QA tests: Verify Reminder model schema, constraints, and relationships are correct (QA Stop Point - do not proceed to user story phases until Phase 2 tests pass)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Set Poll Deadline (Priority: P1) 🎯 MVP

**Goal**: Poll creators can optionally set a deadline date and time when creating polls. The deadline is displayed to all participants.

**Independent Test**: Create a new poll with a deadline set, verify the deadline field appears in the creation form, accepts valid dates, stores the deadline in UTC, and displays it on the poll page. Can be tested independently without auto-closure or reminders.

### Implementation for User Story 1

- [x] T009 [US1] Add deadline field to PollDetailsFormData type in `apps/web/src/components/forms/types.ts`
- [x] T010 [US1] Create deadline date/time picker component in `apps/web/src/components/forms/deadline-picker.tsx` using dayjs and existing date/time picker patterns from poll-options-form
- [x] T011 [US1] Add deadline field to PollDetailsForm component in `apps/web/src/components/forms/poll-details-form.tsx` with optional label and validation
- [x] T012 [US1] Add deadline validation to NewEventData form schema (client-side Zod validation) ensuring deadline is in future
- [x] T013 [US1] Update polls.create mutation input schema to accept optional deadline parameter in `apps/web/src/trpc/routers/polls.ts`
- [x] T014 [US1] Add deadline validation in polls.create mutation (server-side) ensuring deadline is in future
- [x] T015 [US1] Convert deadline from user timezone to UTC in polls.create mutation before storing in database
- [x] T016 [US1] Include deadline field in polls.create mutation data object
- [x] T017 [US1] Update CreatePoll component to pass deadline from form to polls.create mutation in `apps/web/src/components/create-poll.tsx`
- [x] T018 [US1] Include deadline field in polls.get query select statement in `apps/web/src/trpc/routers/polls.ts`
- [x] T019 [US1] Update Poll type definitions to include deadline field (if needed in shared types)

### QA Testing for Phase 3 (User Story 1)

- [x] T074 [P] [US1] Create Phase 3 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-3-user-story-1.feature`
- [ ] T075 [US1] Execute Phase 3 QA tests: Verify deadline can be set during poll creation, validation works correctly, and timezone conversion is accurate (QA Stop Point - do not proceed to Phase 4 until Phase 3 tests pass)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can set deadlines when creating polls and deadlines are stored correctly

---

## Phase 4: User Story 2 - View Deadline and Countdown (Priority: P1)

**Goal**: Poll creators and participants can see the deadline prominently displayed on poll pages with a real-time countdown showing time remaining. The display changes color based on how close the deadline is.

**Independent Test**: View any poll with a deadline set and verify the deadline display appears correctly with appropriate styling based on time remaining (neutral >24h, warning <24h, urgent <6h, gray when passed). The countdown updates in real-time every minute.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create DeadlineCountdown component in `apps/web/src/components/poll/deadline-countdown.tsx` with real-time countdown logic using dayjs
- [ ] T021 [P] [US2] Create DeadlineDisplay component in `apps/web/src/components/deadline-display.tsx` with styling logic based on time remaining (neutral/warning/urgent/passed states)
- [ ] T022 [US2] Create utility function to calculate deadline status (upcoming/warning/urgent/passed) based on hours remaining in `apps/web/src/utils/deadline-utils.ts`
- [ ] T023 [US2] Create utility function to format deadline for display with timezone conversion in `apps/web/src/utils/deadline-utils.ts`
- [ ] T024 [US2] Add DeadlineDisplay component to EventCard in `apps/web/src/components/event-card.tsx` to show deadline prominently on poll pages
- [ ] T025 [US2] Implement client-side countdown update using React.useEffect and setInterval in DeadlineCountdown component (updates every 60 seconds)
- [ ] T026 [US2] Add i18n translation keys for deadline display text (deadline, deadlineLabel, deadlineRemaining, deadlinePassed) using Trans component

### QA Testing for Phase 4 (User Story 2)

- [ ] T076 [P] [US2] Create Phase 4 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-4-user-story-2.feature`
- [ ] T077 [US2] Execute Phase 4 QA tests: Verify deadline display and countdown work correctly with proper styling, regression test Phase 3 (QA Stop Point - do not proceed to Phase 5 until Phases 3-4 tests pass)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - deadlines can be set and displayed with real-time countdown

---

## Phase 5: User Story 3 - Automatic Poll Closure (Priority: P2)

**Goal**: When a poll's deadline is reached, the system automatically closes the poll, preventing new votes while still allowing viewing of existing votes and results. Poll creators are notified via email.

**Independent Test**: Create a poll with a deadline in the near future, wait for the deadline to pass, and verify the poll status changes to paused, new votes are blocked with appropriate error message, existing votes remain visible, and poll creator receives email notification.

### Implementation for User Story 3

- [ ] T027 [P] [US3] Implement close-expired-polls cron job endpoint in `apps/web/src/app/api/house-keeping/[...method]/route.ts` following existing house-keeping pattern
- [ ] T028 [US3] Add query logic to find polls where deadline <= NOW() AND status = 'live' AND deadline IS NOT NULL in close-expired-polls endpoint
- [ ] T029 [US3] Update poll status to 'paused' for expired polls in batches (BATCH_SIZE = 100) in close-expired-polls endpoint
- [ ] T030 [US3] Create DeadlineClosedEmail template in `packages/emails/src/templates/deadline-closed.tsx` following existing email template patterns
- [ ] T031 [US3] Add DeadlineClosedEmail to templates.ts export in `packages/emails/src/templates.ts`
- [ ] T032 [US3] Send email notification to poll creator when poll is closed at deadline in close-expired-polls endpoint (query poll.user.email and send via EmailClient)
- [ ] T033 [US3] Add deadline status check in polls.get query to handle cases where cron job may have missed closure in `apps/web/src/trpc/routers/polls.ts`
- [ ] T034 [US3] Update poll status to 'paused' synchronously in polls.get if deadline passed and status is still 'live'
- [ ] T035 [US3] Add validation to prevent voting after deadline in vote submission logic (find where votes are created)
- [ ] T036 [US3] Add error message display when users attempt to vote after deadline showing the deadline date/time
- [ ] T037 [US3] Configure close-expired-polls cron job in `apps/web/vercel.json` with schedule "*/15 * * * *" (every 15 minutes)
- [ ] T038 [US3] Add i18n translation keys for deadline closure error messages using Trans component

### QA Testing for Phase 5 (User Story 3)

- [ ] T078 [P] [US3] Create Phase 5 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-5-user-story-3.feature`
- [ ] T079 [US3] Execute Phase 5 QA tests: Verify automatic closure works, voting is blocked, emails are sent, and synchronous checks work, regression test Phases 3-4 (QA Stop Point - do not proceed to Phase 6 until Phases 3-5 tests pass)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work independently - deadlines close polls automatically and prevent new votes

---

## Phase 6: User Story 4 - Edit Poll Deadline (Priority: P2)

**Goal**: Poll creators can edit or remove the deadline on existing polls, but only if the deadline hasn't passed yet. If the deadline has passed, it's displayed as read-only with a "Deadline passed" message.

**Independent Test**: Edit an existing poll's deadline, verify changes are saved, attempt to edit a deadline that has already passed, and verify it's read-only with appropriate message.

### Implementation for User Story 4

- [ ] T039 [US4] Add deadline field to PollSettingsFormData type in `apps/web/src/components/forms/poll-settings.tsx` (or create separate deadline editing component)
- [ ] T040 [US4] Add deadline field to poll edit form (determine if in PollSettingsForm or separate deadline editing component) with date/time picker
- [ ] T041 [US4] Load existing deadline value in poll edit form and convert from UTC to user timezone for display
- [ ] T042 [US4] Add validation to check if deadline has passed before allowing edit (display read-only with "Deadline passed" message if passed)
- [ ] T043 [US4] Update polls.update mutation input schema to accept optional deadline parameter (nullable) in `apps/web/src/trpc/routers/polls.ts`
- [ ] T044 [US4] Add validation in polls.update mutation to prevent editing deadline if existing deadline has passed
- [ ] T045 [US4] Add validation in polls.update mutation to ensure new deadline is in future (if provided)
- [ ] T046 [US4] Convert deadline from user timezone to UTC in polls.update mutation before storing
- [ ] T047 [US4] Include deadline field in polls.update mutation data object (allow setting to null to remove deadline)
- [ ] T048 [US4] Update poll edit form submission to include deadline in polls.update mutation call
- [ ] T049 [US4] Add i18n translation keys for deadline editing (deadlineEditLabel, deadlinePassed, deadlineCannotEditPassed)

### QA Testing for Phase 6 (User Story 4)

- [ ] T080 [P] [US4] Create Phase 6 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-6-user-story-4.feature`
- [ ] T081 [US4] Execute Phase 6 QA tests: Verify deadline editing works correctly with proper validation and read-only states, regression test Phases 3-5 (QA Stop Point - do not proceed to Phase 7 until Phases 3-6 tests pass)

**Checkpoint**: At this point, User Stories 1-4 should work independently - deadlines can be set, displayed, auto-closed, and edited

---

## Phase 7: User Story 5 - Reminder Emails to Non-Responders (Priority: P3)

**Goal**: Participants who haven't responded to a poll receive reminder emails before the deadline, sent at configurable intervals (24 hours before, 6 hours before, 1 hour before). Emails include poll title, deadline, time remaining, and a direct link to respond.

**Independent Test**: Create a poll with a deadline, add participants with email addresses who haven't voted, verify non-responders receive reminder emails at appropriate intervals (24h-23h, 6h-5h, 1h-0h before deadline), and verify participants who already voted don't receive reminders.

### Implementation for User Story 5

- [ ] T050 [P] [US5] Create DeadlineReminderEmail template in `packages/emails/src/templates/deadline-reminder.tsx` following existing email template patterns
- [ ] T051 [US5] Add DeadlineReminderEmail to templates.ts export in `packages/emails/src/templates.ts`
- [ ] T052 [US5] Implement send-reminder-emails cron job endpoint in `apps/web/src/app/api/house-keeping/[...method]/route.ts` following existing house-keeping pattern
- [ ] T053 [US5] Add query logic to find polls with deadlines in windows: 24h-23h, 6h-5h, 1h-0h before deadline in send-reminder-emails endpoint
- [ ] T054 [US5] For each poll, query participants who have email addresses and have not voted (check votes table)
- [ ] T055 [US5] Check Reminder table to see if participant already received reminder for this interval (pollId + participantId + reminderType)
- [ ] T056 [US5] Group participants by email address for polls where multiple participants share same email
- [ ] T057 [US5] Send reminder email per unique email address listing all associated participants in email content
- [ ] T058 [US5] Create Reminder records in database to track sent reminders (pollId, participantId, reminderType, sentAt) in batches
- [ ] T059 [US5] Handle errors gracefully in send-reminder-emails endpoint (log errors, don't block other reminders)
- [ ] T060 [US5] Configure send-reminder-emails cron job in `apps/web/vercel.json` with schedule "0 * * * *" (every hour)
- [ ] T061 [US5] Add i18n translation keys for reminder email content (reminderEmailSubject, reminderEmailContent) in email template

### QA Testing for Phase 7 (User Story 5)

- [ ] T082 [P] [US5] Create Phase 7 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-7-user-story-5.feature`
- [ ] T083 [US5] Execute Phase 7 QA tests: Verify reminder emails are sent at correct intervals, duplicates are prevented, and emails contain required information, regression test Phases 3-6 (QA Stop Point - do not proceed to Phase 8 until Phases 3-7 tests pass)

**Checkpoint**: At this point, all user stories should work independently - complete deadline enforcement feature is functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Add deadline field to poll list/dashboard queries if displaying deadlines in poll lists (optional enhancement per FR-021)
- [ ] T063 [P] Add logging for deadline enforcement operations (poll closure events, reminder sends) for monitoring
- [ ] T064 [P] Add error handling and logging for timezone conversion edge cases (daylight saving time transitions)
- [ ] T065 [P] Update PostHog analytics events to include deadline information in poll creation/update events
- [ ] T066 [P] Code cleanup and refactoring (review all deadline-related code for consistency)
- [ ] T067 [P] Run quickstart.md validation checklist to verify all implementation items are complete
- [ ] T068 [P] Performance testing: Verify deadline enforcement job completes within 5 minutes, reminder job completes within time limits
- [ ] T069 [P] Integration testing: End-to-end test of complete deadline enforcement flow (create poll → set deadline → wait for closure → verify reminders)

### QA Testing for Phase 8 (Polish)

- [ ] T084 [P] Create Phase 8 QA test file with Gherkin scenarios in `specs/001-poll-deadline-enforcement/tests/phase-8-polish.feature`
- [ ] T085 Execute Phase 8 QA tests: Final regression testing of all phases, verify performance, analytics, error handling, and integration with existing features (All tests from Phases 1-7 should pass, plus Phase 8 specific tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Requires deadline data from US1, but can work with mock data for testing
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Requires deadline field from US1
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Requires deadline field from US1, builds on US3 validation patterns
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Requires Reminder model from Foundational phase, can work independently

### Within Each User Story

- Models/database changes before UI components
- Backend validation before frontend display
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (T002-T008)
- User Story 2 tasks marked [P] can run in parallel (T020-T021)
- User Story 5 tasks marked [P] can run in parallel (T050)
- Once Foundational phase completes, User Stories 1-5 can start in parallel (if team capacity allows)
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch deadline display components in parallel:
Task: "Create DeadlineCountdown component in apps/web/src/components/poll/deadline-countdown.tsx"
Task: "Create DeadlineDisplay component in apps/web/src/components/deadline-display.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (database index)
2. Complete Phase 2: Foundational (Reminder model) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (Set Deadline)
4. Complete Phase 4: User Story 2 (View Deadline & Countdown)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready (MVP delivers basic deadline functionality)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Stories 1 & 2 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test independently → Deploy/Demo (Auto-closure)
4. Add User Story 4 → Test independently → Deploy/Demo (Deadline editing)
5. Add User Story 5 → Test independently → Deploy/Demo (Reminder emails)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Set Deadline)
   - Developer B: User Story 2 (View Deadline) - can start with mock deadline data
   - Developer C: User Story 3 (Auto-closure) - can start with mock deadline data
3. Once US1 complete:
   - Developer A: User Story 4 (Edit Deadline)
   - Developer B: User Story 5 (Reminders)
   - Developer C: Polish & testing
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Deadline field already exists in Poll model - no schema change needed for basic deadline storage
- Reminder model must be created in Foundational phase before User Story 5
- All date/time operations MUST use dayjs (constitution requirement)
- All UI text MUST use Trans component or getTranslations (constitution requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

**Total Tasks**: 85 (69 implementation + 16 QA testing)
- Phase 1 (Setup): 1 implementation task + 2 QA tasks = 3 tasks
- Phase 2 (Foundational): 7 implementation tasks + 2 QA tasks = 9 tasks
- Phase 3 (User Story 1): 11 implementation tasks + 2 QA tasks = 13 tasks
- Phase 4 (User Story 2): 7 implementation tasks + 2 QA tasks = 9 tasks
- Phase 5 (User Story 3): 12 implementation tasks + 2 QA tasks = 14 tasks
- Phase 6 (User Story 4): 11 implementation tasks + 2 QA tasks = 13 tasks
- Phase 7 (User Story 5): 12 implementation tasks + 2 QA tasks = 14 tasks
- Phase 8 (Polish): 8 implementation tasks + 2 QA tasks = 10 tasks

**Parallel Opportunities**: 
- Foundational: 2 parallel tasks (T002-T003)
- User Story 2: 2 parallel tasks (T020-T021)
- User Story 5: 1 parallel task (T050)
- Polish: 8 parallel tasks (T062-T069)
- QA Testing: All QA test file creation tasks (T070, T072, T074, T076, T078, T080, T082, T084) can run in parallel after their respective phases complete

**Suggested MVP Scope**: Phases 1-4 (Setup + Foundational + User Stories 1 & 2) - delivers deadline setting and display functionality

