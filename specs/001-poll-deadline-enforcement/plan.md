# Implementation Plan: Poll Deadline Enforcement

**Branch**: `001-poll-deadline-enforcement` | **Date**: 2025-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-poll-deadline-enforcement/spec.md`

## Summary

Enable poll creators to set optional deadlines for polls, automatically close polls when deadlines pass, send reminder emails to non-responders, and display deadline information with real-time countdowns. The deadline field already exists in the database schema (DateTime?, nullable), requiring UI implementation, deadline enforcement logic, email reminders, and visual countdown components.

**Technical Approach**: Extend existing poll creation/editing forms with date-time picker, add cron jobs for deadline enforcement and reminder emails, implement deadline display components with real-time countdown, and add validation to prevent voting after deadlines.

## Technical Context

**Language/Version**: TypeScript 5.8.2, Node.js 20.x  
**Primary Dependencies**: Next.js 15.4.10, React 19.1.4, Prisma 6.8.2, tRPC 11.1.2, dayjs 1.11.13  
**Storage**: PostgreSQL 14.2 via Prisma ORM (deadline field already exists in Poll model)  
**Testing**: Vitest 2.1.9 (unit tests), Playwright 1.52.0 (integration tests)  
**Target Platform**: Next.js App Router (React Server Components), Vercel hosting  
**Project Type**: Web application (monorepo structure)  
**Performance Goals**: Deadline enforcement job completes within 5 minutes, countdown updates every minute, 95% email delivery rate  
**Constraints**: Must use existing cron job pattern (Hono routes in `/api/house-keeping`), deadline stored in UTC, timezone conversions for display, email sending via existing EmailClient infrastructure  
**Scale/Scope**: All polls can have optional deadlines, reminder emails sent to participants with valid emails, cron jobs run hourly for reminders and every 15 minutes for enforcement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check ✅

- ✅ **Code Quality**: Will use Biome formatting (2 spaces, double quotes, 80 char width)
- ✅ **Type Safety**: Full TypeScript coverage, separate type imports required
- ✅ **Testing**: Integration tests required for deadline enforcement, unit tests for deadline validation logic
- ✅ **Component Design**: Composable components following shadcn UI patterns, minimal props, Icon component usage
- ✅ **i18n**: All UI text must use Trans component or getTranslations, i18n keys in camelCase
- ✅ **Performance**: Database queries optimized, React Server Components where possible, proper indexes
- ✅ **Quality Gates**: All checks (lint, type-check, tests) must pass before merge

### Post-Phase 1 Check ✅

- ✅ **Design Compliance**: Follows existing patterns (cron jobs, email templates, form validation)
- ✅ **Database**: Uses existing deadline field, no schema changes needed (may add index for performance)
- ✅ **Date Handling**: Uses dayjs as required by constitution
- ✅ **Component Patterns**: Reuses existing date/time picker patterns from poll options form
- ✅ **Email Infrastructure**: Uses existing EmailClient and template system

## Project Structure

### Documentation (this feature)

```text
specs/001-poll-deadline-enforcement/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
└── tests/               # QA test scenarios in Gherkin syntax
    ├── phase-1-setup.feature
    ├── phase-2-foundational.feature
    ├── phase-3-user-story-1.feature
    ├── phase-4-user-story-2.feature
    ├── phase-5-user-story-3.feature
    ├── phase-6-user-story-4.feature
    ├── phase-7-user-story-5.feature
    └── phase-8-polish.feature
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── house-keeping/
│   │   │       └── [...method]/
│   │   │           └── route.ts          # Add deadline enforcement & reminder cron jobs
│   │   └── [locale]/
│   │       └── (optional-space)/
│   │           └── poll/
│   │               └── [urlId]/
│   │                   ├── page.tsx      # Add deadline display component
│   │                   └── edit-options/
│   │                       └── page.tsx  # Add deadline editing
│   ├── components/
│   │   ├── forms/
│   │   │   ├── poll-details-form.tsx     # Add deadline field
│   │   │   └── poll-settings.tsx         # Alternative location for deadline
│   │   ├── poll/
│   │   │   └── deadline-countdown.tsx    # New: Real-time countdown component
│   │   └── deadline-display.tsx          # New: Deadline display with styling
│   ├── features/
│   │   └── poll/
│   │       ├── mutations.ts              # Add deadline update mutations
│   │       └── queries.ts                # Include deadline in queries
│   └── trpc/
│       └── routers/
│           └── polls.ts                  # Add deadline to create/update mutations, validation
│
packages/
├── database/
│   └── prisma/
│       └── models/
│           └── poll.prisma               # Deadline field exists, may add index
│
└── emails/
    └── src/
        └── templates/
            └── deadline-reminder.tsx     # New: Reminder email template

tests/
└── apps/web/tests/
    ├── deadline-enforcement.spec.ts      # New: Integration tests
    └── deadline-reminders.spec.ts        # New: Reminder email tests
```

**Structure Decision**: Monorepo structure with apps/web containing Next.js application. Poll deadline feature extends existing poll functionality without creating new major subsystems. New components follow existing patterns (deadline-countdown similar to other poll display components, deadline field in existing form components). Cron jobs follow existing house-keeping pattern.

## Complexity Tracking

> **No violations** - All design decisions follow existing patterns and constitution requirements.

## Testing Strategy

**QA Checkpoints**: After each implementation phase, QA should stop and verify the feature using the Gherkin test scenarios below. Each phase builds upon previous phases, so regression testing should include all previous phase tests.

### Phase 1: Setup - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-1-setup.feature`

```gherkin
Feature: Database Index Setup for Poll Deadline
  As a system administrator
  I want database indexes optimized for deadline queries
  So that deadline enforcement cron jobs perform efficiently

  Scenario: Database index exists on Poll.deadline field
    Given the database schema has been migrated
    When I query the database indexes
    Then there should be an index on Poll.deadline field
    And the index should support efficient queries for deadline <= NOW()

  Scenario: Index supports nullable deadline queries
    Given polls exist with and without deadlines
    When I query polls with deadline IS NOT NULL
    Then the query should use the deadline index
    And the query should complete within acceptable time limits
```

**QA Stop Point**: Verify database index exists and performs efficiently before proceeding to Phase 2.

---

### Phase 2: Foundational - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-2-foundational.feature`

```gherkin
Feature: Reminder Model and Database Schema
  As a developer
  I want a Reminder model to track sent reminder emails
  So that we can prevent duplicate reminder emails

  Background:
    Given the database schema has been migrated
    And the Reminder model exists in the database

  Scenario: Reminder model has required fields
    Given I query the Reminder table schema
    Then it should have an id field
    And it should have a pollId field
    And it should have a participantId field
    And it should have a reminderType field
    And it should have a sentAt field
    And it should have a createdAt field

  Scenario: ReminderType enum has correct values
    Given I query the ReminderType enum
    Then it should include "twentyFourHours"
    And it should include "sixHours"
    And it should include "oneHour"

  Scenario: Unique constraint prevents duplicate reminders
    Given a Reminder record exists with pollId "poll1", participantId "part1", reminderType "twentyFourHours"
    When I attempt to create another Reminder with the same pollId, participantId, and reminderType
    Then the database should reject the duplicate
    And an error should be raised

  Scenario: Reminder relationships are properly configured
    Given a Poll exists with id "poll1"
    And a Participant exists with id "part1" for poll "poll1"
    When I create a Reminder linking poll "poll1" and participant "part1"
    Then the Reminder should be successfully created
    And the Reminder should have a foreign key relationship to Poll
    And the Reminder should have a foreign key relationship to Participant
    And when I delete the Poll, the Reminder should be cascade deleted
```

**QA Stop Point**: Verify Reminder model schema, constraints, and relationships are correct before proceeding to user story phases.

---

### Phase 3: User Story 1 - Set Poll Deadline - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-3-user-story-1.feature`

```gherkin
Feature: Set Poll Deadline
  As a poll creator
  I want to set an optional deadline when creating a poll
  So that participants know when the poll will close

  Background:
    Given I am logged in as a poll creator
    And I am on the poll creation page

  Scenario: Deadline field appears in poll creation form
    When I view the poll creation form
    Then I should see a deadline field
    And the deadline field should be optional
    And the deadline field should have a date picker
    And the deadline field should have a time picker

  Scenario: Create poll with valid future deadline
    Given I am filling out the poll creation form
    When I set a deadline that is 2 days in the future
    And I submit the poll creation form
    Then the poll should be created successfully
    And the poll should have the deadline stored in the database
    And the deadline should be stored in UTC format
    And when I view the created poll, the deadline should be displayed

  Scenario: Create poll with deadline in the past is rejected
    Given I am filling out the poll creation form
    When I attempt to set a deadline that is 1 day in the past
    And I attempt to submit the poll creation form
    Then I should see a validation error
    And the error message should indicate the deadline must be in the future
    And the poll should not be created

  Scenario: Create poll without deadline
    Given I am filling out the poll creation form
    When I leave the deadline field empty
    And I submit the poll creation form
    Then the poll should be created successfully
    And the poll should have no deadline (null)
    And the poll should behave as before (no deadline enforcement)

  Scenario: Deadline timezone conversion works correctly
    Given I am in timezone "America/New_York"
    When I set a deadline for "2025-01-20 15:00" in my local timezone
    And I submit the poll creation form
    Then the deadline should be stored in UTC in the database
    And when I view the poll, the deadline should display in my local timezone "America/New_York"
    And the displayed deadline should show the correct timezone indicator
```

**QA Stop Point**: Verify deadline can be set during poll creation, validation works correctly, and timezone conversion is accurate. Do not proceed to Phase 4 until Phase 3 tests pass.

---

### Phase 4: User Story 2 - View Deadline and Countdown - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-4-user-story-2.feature`

```gherkin
Feature: View Deadline and Countdown
  As a poll participant or creator
  I want to see the deadline prominently displayed with a countdown
  So that I know how much time remains to respond

  Background:
    Given a poll exists with id "poll1"
    And the poll has a deadline set

  Scenario: Deadline is displayed prominently on poll page
    Given I am viewing poll "poll1"
    When the poll page loads
    Then I should see the deadline displayed prominently
    And the deadline should show the date
    And the deadline should show the time
    And the deadline should show the timezone indicator

  Scenario: Countdown displays time remaining correctly
    Given poll "poll1" has a deadline 3 days in the future
    When I view poll "poll1"
    Then I should see a countdown showing "3 days"
    And the countdown should update every minute
    And after 1 minute, the countdown should update to show the new time remaining

  Scenario: Deadline display uses neutral styling for far future deadlines
    Given poll "poll1" has a deadline more than 24 hours in the future
    When I view poll "poll1"
    Then the deadline display should use neutral/default styling

  Scenario: Deadline display uses warning styling for approaching deadline
    Given poll "poll1" has a deadline less than 24 hours away
    And poll "poll1" has a deadline more than 6 hours away
    When I view poll "poll1"
    Then the deadline display should use warning styling (yellow/orange colors)

  Scenario: Deadline display uses urgent styling for very close deadline
    Given poll "poll1" has a deadline less than 6 hours away
    When I view poll "poll1"
    Then the deadline display should use urgent styling (red colors)

  Scenario: Deadline display shows disabled state for passed deadline
    Given poll "poll1" has a deadline that has already passed
    When I view poll "poll1"
    Then the deadline display should show as disabled/grayed out
    And the countdown should show "0" or indicate the deadline has passed

  Scenario: Countdown shows days, hours, and minutes
    Given poll "poll1" has a deadline 2 days, 5 hours, and 30 minutes in the future
    When I view poll "poll1"
    Then the countdown should display "2 days, 5 hours, 30 minutes" remaining
```

**QA Stop Point**: Verify deadline display and countdown work correctly with proper styling. Regression test Phase 3 functionality. Do not proceed to Phase 5 until Phases 3-4 tests pass.

---

### Phase 5: User Story 3 - Automatic Poll Closure - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-5-user-story-3.feature`

```gherkin
Feature: Automatic Poll Closure at Deadline
  As the system
  I want to automatically close polls when their deadline passes
  So that deadlines are enforced and participants cannot vote after the deadline

  Background:
    Given a poll exists with id "poll1"
    And poll "poll1" has status "live"
    And poll "poll1" has participants who have voted
    And poll "poll1" has a deadline set

  Scenario: Cron job closes polls with passed deadlines
    Given poll "poll1" has a deadline that has passed
    When the deadline enforcement cron job runs
    Then poll "poll1" status should be updated to "paused"
    And the status change should be logged

  Scenario: Participant cannot vote after deadline passes
    Given poll "poll1" has a deadline that has passed
    And poll "poll1" status is "paused"
    When a participant attempts to submit a vote on poll "poll1"
    Then the vote submission should be rejected
    And an error message should be displayed
    And the error message should indicate the poll has closed
    And the error message should show the deadline date/time
    And the error message should display the deadline in the user's timezone

  Scenario: Existing votes remain visible after deadline passes
    Given poll "poll1" has existing votes before the deadline
    And poll "poll1" has a deadline that has passed
    When I view poll "poll1"
    Then I should see all existing votes
    And I should see the poll results
    And I should be able to view all participant responses

  Scenario: Poll creator receives email notification when poll closes
    Given poll "poll1" belongs to a user with email "creator@example.com"
    And poll "poll1" has a deadline that has passed
    When the deadline enforcement cron job runs
    Then an email should be sent to "creator@example.com"
    And the email subject should indicate the poll was closed at deadline
    And the email should include the poll title
    And the email should include a link to view the poll

  Scenario: Synchronous deadline check on poll load
    Given poll "poll1" has a deadline that has passed
    And poll "poll1" status is still "live" (cron job may have missed it)
    When I load poll "poll1" via the API
    Then the poll status should be immediately updated to "paused"
    And the updated poll with status "paused" should be returned

  Scenario: Cron job processes polls in batches
    Given 150 polls exist with passed deadlines and status "live"
    When the deadline enforcement cron job runs
    Then all 150 polls should have status updated to "paused"
    And the job should process in batches of 100
    And the job should complete within 5 minutes
```

**QA Stop Point**: Verify automatic closure works, voting is blocked, emails are sent, and synchronous checks work. Regression test Phases 3-4. Do not proceed to Phase 6 until Phases 3-5 tests pass.

---

### Phase 6: User Story 4 - Edit Poll Deadline - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-6-user-story-4.feature`

```gherkin
Feature: Edit Poll Deadline
  As a poll creator
  I want to edit or remove the deadline on my poll
  So that I can adjust the deadline if circumstances change

  Background:
    Given I am logged in as a poll creator
    And a poll exists with id "poll1" that I created
    And poll "poll1" has a deadline set that hasn't passed

  Scenario: Edit deadline on poll with future deadline
    Given I am viewing the edit form for poll "poll1"
    When I modify the deadline to a new future date
    And I save the changes
    Then the poll deadline should be updated in the database
    And the new deadline should be stored in UTC
    And when I view poll "poll1", the new deadline should be displayed

  Scenario: Remove deadline from poll
    Given I am viewing the edit form for poll "poll1"
    When I remove the deadline (set to null)
    And I save the changes
    Then the poll should have no deadline (null)
    And the poll should behave as before (no deadline enforcement)

  Scenario: Cannot edit deadline after it has passed
    Given poll "poll1" has a deadline that has already passed
    When I view the edit form for poll "poll1"
    Then the deadline field should be displayed as read-only
    And a message should indicate "Deadline passed"
    And I should not be able to modify the deadline
    And if I attempt to submit with a modified deadline, it should be rejected

  Scenario: Validation prevents setting deadline in the past
    Given I am viewing the edit form for poll "poll1"
    When I attempt to set a new deadline that is in the past
    And I attempt to save the changes
    Then I should see a validation error
    And the error message should indicate the deadline must be in the future
    And the deadline should not be updated

  Scenario: Extending deadline keeps poll open
    Given poll "poll1" has a deadline 1 day in the future
    When I extend the deadline to 3 days in the future
    And I save the changes
    Then poll "poll1" should remain open (status "live")
    And poll "poll1" should accept new votes
    And the new deadline should be enforced when it arrives
```

**QA Stop Point**: Verify deadline editing works correctly with proper validation and read-only states. Regression test Phases 3-5. Do not proceed to Phase 7 until Phases 3-6 tests pass.

---

### Phase 7: User Story 5 - Reminder Emails - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-7-user-story-5.feature`

```gherkin
Feature: Reminder Emails to Non-Responders
  As the system
  I want to send reminder emails to participants who haven't voted
  So that participation rates increase before the deadline

  Background:
    Given a poll exists with id "poll1"
    And poll "poll1" has a deadline set
    And poll "poll1" has participants with email addresses

  Scenario: Send 24-hour reminder email to non-responders
    Given poll "poll1" has a deadline 23.5 hours away
    And participant "part1" with email "participant1@example.com" has not voted
    And participant "part2" with email "participant2@example.com" has not voted
    When the reminder email cron job runs
    Then an email should be sent to "participant1@example.com"
    And an email should be sent to "participant2@example.com"
    And a Reminder record should be created for participant "part1" with reminderType "twentyFourHours"
    And a Reminder record should be created for participant "part2" with reminderType "twentyFourHours"

  Scenario: Send 6-hour reminder email to non-responders
    Given poll "poll1" has a deadline 5.5 hours away
    And participant "part1" with email "participant1@example.com" has not voted
    And no 6-hour reminder has been sent to participant "part1"
    When the reminder email cron job runs
    Then an email should be sent to "participant1@example.com"
    And a Reminder record should be created for participant "part1" with reminderType "sixHours"

  Scenario: Send 1-hour reminder email to non-responders
    Given poll "poll1" has a deadline 0.5 hours away
    And participant "part1" with email "participant1@example.com" has not voted
    And no 1-hour reminder has been sent to participant "part1"
    When the reminder email cron job runs
    Then an email should be sent to "participant1@example.com"
    And a Reminder record should be created for participant "part1" with reminderType "oneHour"

  Scenario: Do not send reminder to participants who have already voted
    Given poll "poll1" has a deadline 23.5 hours away
    And participant "part1" with email "participant1@example.com" has already voted
    When the reminder email cron job runs
    Then no email should be sent to "participant1@example.com"
    And no Reminder record should be created for participant "part1"

  Scenario: Do not send reminders after deadline has passed
    Given poll "poll1" has a deadline that has already passed
    And participant "part1" with email "participant1@example.com" has not voted
    When the reminder email cron job runs
    Then no email should be sent to "participant1@example.com"
    And no Reminder record should be created

  Scenario: Reminder email contains required information
    Given poll "poll1" has title "Team Meeting"
    And poll "poll1" has a deadline 23.5 hours away
    And participant "part1" with email "participant1@example.com" has not voted
    When the reminder email cron job runs
    Then an email should be sent to "participant1@example.com"
    And the email should include the poll title "Team Meeting"
    And the email should include the deadline date and time
    And the email should include the time remaining until deadline
    And the email should include a direct link to the poll

  Scenario: Prevent duplicate reminder emails
    Given poll "poll1" has a deadline 23.5 hours away
    And participant "part1" with email "participant1@example.com" has not voted
    And a Reminder record already exists for participant "part1" with reminderType "twentyFourHours"
    When the reminder email cron job runs
    Then no email should be sent to "participant1@example.com"
    And no new Reminder record should be created

  Scenario: Multiple participants with same email receive one email
    Given poll "poll1" has a deadline 23.5 hours away
    And participant "part1" with email "shared@example.com" has not voted
    And participant "part2" with email "shared@example.com" has not voted
    When the reminder email cron job runs
    Then one email should be sent to "shared@example.com"
    And the email should list both participant "part1" and participant "part2"
    And Reminder records should be created for both participants
```

**QA Stop Point**: Verify reminder emails are sent at correct intervals, duplicates are prevented, and emails contain required information. Regression test Phases 3-6. Do not proceed to Phase 8 until Phases 3-7 tests pass.

---

### Phase 8: Polish & Cross-Cutting Concerns - Testing

**Location**: `specs/001-poll-deadline-enforcement/tests/phase-8-polish.feature`

```gherkin
Feature: Deadline Feature Polish and Integration
  As a system
  I want the deadline feature to work smoothly with all existing features
  So that the user experience is seamless

  Scenario: Deadline information appears in poll lists
    Given multiple polls exist with deadlines
    When I view the poll list/dashboard
    Then polls with deadlines should display deadline information
    And the deadline information should be formatted correctly

  Scenario: Timezone handling works across different user timezones
    Given poll "poll1" has a deadline set in UTC
    And user "user1" is in timezone "America/New_York"
    And user "user2" is in timezone "Europe/London"
    When user "user1" views poll "poll1"
    Then the deadline should display in "America/New_York" timezone
    When user "user2" views poll "poll1"
    Then the deadline should display in "Europe/London" timezone
    And both users should see the same UTC deadline converted correctly

  Scenario: Analytics events include deadline information
    Given a poll is created with a deadline
    When the poll creation analytics event is captured
    Then the event should include deadline information
    And the event should include whether a deadline was set

  Scenario: Performance requirements are met
    Given 1000 polls exist with deadlines
    When the deadline enforcement cron job runs
    Then the job should complete within 5 minutes
    And all polls with passed deadlines should be closed

  Scenario: Error handling for edge cases
    Given poll "poll1" has an invalid deadline configuration
    When the deadline enforcement process attempts to process poll "poll1"
    Then the error should be logged
    And the error should not prevent other polls from being processed
    And the system should continue to function normally
```

**QA Stop Point**: Final regression testing of all phases. Verify performance, analytics, error handling, and integration with existing features. All tests from Phases 1-7 should pass, plus Phase 8 specific tests.

---

## Testing Execution Notes

- **Test Execution Order**: Tests must be executed in phase order (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8)
- **Regression Testing**: Each phase includes regression testing of previous phases
- **Stop Points**: QA must stop and verify tests pass before proceeding to the next phase
- **Test Environment**: Tests should be run in a development/staging environment that mirrors production
- **Data Setup**: Each scenario's Background section defines the required test data setup
- **Performance Testing**: Phase 8 includes performance verification, but performance should be monitored throughout
