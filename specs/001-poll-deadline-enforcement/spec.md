# Feature Specification: Poll Deadline Enforcement

**Feature Branch**: `001-poll-deadline-enforcement`  
**Created**: 2025-01-17  
**Status**: Draft  
**Input**: User description: "Poll Deadline Enforcement: Enable poll creators to set deadlines, automatically close polls, send reminder emails, and display deadline information"

## Clarifications

### Session 2025-01-17

- Q: How should poll creators be notified when their poll automatically closes at the deadline? → A: Email notification sent to poll creator's email address (using existing notification infrastructure)
- Q: When multiple participants share the same email address on a poll, how should reminder emails be handled? → A: Send one reminder email per email address, listing all participants with that email
- Q: Should reminder emails be sent at exact times or within time windows? → A: Send reminders within 1-hour windows before each interval (24-23h, 6-5h, 1-0h before deadline)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Poll Deadline (Priority: P1)

When creating a poll, a poll creator can optionally set a deadline date and time. This deadline represents when the poll will automatically close and stop accepting new votes. The deadline is displayed to all participants so they know when they need to respond.

**Why this priority**: This is the core functionality - without the ability to set deadlines, none of the other features (auto-closure, reminders, countdown) are possible. This delivers immediate value by allowing poll creators to set expectations for participants.

**Independent Test**: Can be fully tested by creating a new poll and verifying the deadline field appears in the creation form, accepts valid dates, stores the deadline, and displays it on the poll page. This delivers value independently by enabling deadline communication even if auto-closure isn't implemented yet.

**Acceptance Scenarios**:

1. **Given** a user is creating a new poll, **When** they view the poll creation form, **Then** they see an optional deadline field with date and time picker
2. **Given** a user is creating a poll, **When** they set a deadline in the future, **Then** the deadline is saved and displayed on the poll page
3. **Given** a user is creating a poll, **When** they attempt to set a deadline in the past, **Then** they see a validation error preventing submission
4. **Given** a user creates a poll without setting a deadline, **Then** the poll behaves as before (no deadline enforcement)

---

### User Story 2 - View Deadline and Countdown (Priority: P1)

Poll creators and participants can see the deadline prominently displayed on poll pages with a real-time countdown showing time remaining. The display changes color based on how close the deadline is (neutral for >24h, warning for <24h, urgent for <6h, gray when passed).

**Why this priority**: This provides immediate feedback and urgency to participants, encouraging timely responses. It's essential for the deadline feature to be useful - users need to see when the deadline is approaching.

**Independent Test**: Can be fully tested by viewing any poll with a deadline set and verifying the deadline display appears correctly with appropriate styling based on time remaining. The countdown updates in real-time. This delivers value by creating urgency and clarity about timing.

**Acceptance Scenarios**:

1. **Given** a poll has a deadline set, **When** a user views the poll page, **Then** they see the deadline date, time, and timezone displayed prominently
2. **Given** a poll has a deadline more than 24 hours away, **When** a user views the poll, **Then** the deadline display uses neutral styling
3. **Given** a poll has a deadline less than 24 hours away, **When** a user views the poll, **Then** the deadline display uses warning styling (yellow/orange)
4. **Given** a poll has a deadline less than 6 hours away, **When** a user views the poll, **Then** the deadline display uses urgent styling (red)
5. **Given** a poll has a deadline that has passed, **When** a user views the poll, **Then** the deadline display shows as disabled/grayed out
6. **Given** a poll has a deadline set, **When** a user views the poll page, **Then** the countdown updates in real-time showing days, hours, and minutes remaining

---

### User Story 3 - Automatic Poll Closure (Priority: P2)

When a poll's deadline is reached, the system automatically closes the poll, preventing new votes while still allowing viewing of existing votes and results. Poll creators are notified via email when their poll closes at the deadline.

**Why this priority**: This is a core enforcement mechanism that makes the deadline meaningful. Without automatic closure, deadlines would be advisory only. However, it can be implemented after basic deadline display (P1) to deliver incremental value.

**Independent Test**: Can be fully tested by creating a poll with a deadline in the near future, waiting for the deadline to pass, and verifying the poll status changes to closed, new votes are blocked, and existing votes remain visible. This delivers value by enforcing the deadline automatically.

**Acceptance Scenarios**:

1. **Given** a poll has a deadline that has passed, **When** the deadline enforcement process runs, **Then** the poll status is updated to closed/paused
2. **Given** a poll has been closed due to deadline, **When** a participant attempts to submit a vote, **Then** they see an error message indicating the poll has closed and showing the deadline date/time
3. **Given** a poll has been closed due to deadline, **When** a user views the poll, **Then** they can still see all existing votes and results
4. **Given** a poll has been closed due to deadline, **When** the poll closes automatically, **Then** the poll creator receives an email notification indicating the poll was automatically closed at the deadline
5. **Given** a poll has been closed due to deadline, **When** the poll creator views the poll, **Then** they can see the poll status indicates it was closed at the deadline

---

### User Story 4 - Edit Poll Deadline (Priority: P2)

Poll creators can edit or remove the deadline on existing polls, but only if the deadline hasn't passed yet. If the deadline has passed, it's displayed as read-only with a "Deadline passed" message.

**Why this priority**: This provides flexibility for poll creators to adjust deadlines if circumstances change. It's important but not critical for initial implementation - creators could recreate polls if needed. Lower priority than basic deadline functionality.

**Independent Test**: Can be fully tested by editing an existing poll's deadline, verifying changes are saved, and attempting to edit a deadline that has already passed. This delivers value by allowing deadline adjustments.

**Acceptance Scenarios**:

1. **Given** a poll has a deadline set that hasn't passed, **When** the poll creator edits the poll, **Then** they can modify the deadline date/time
2. **Given** a poll has a deadline set, **When** the poll creator edits the poll, **Then** they can remove the deadline (set to null)
3. **Given** a poll has a deadline that has passed, **When** the poll creator views the poll edit form, **Then** the deadline is displayed as read-only with "Deadline passed" message
4. **Given** a poll creator extends a deadline, **When** the new deadline is saved, **Then** the poll remains open until the new deadline

---

### User Story 5 - Reminder Emails to Non-Responders (Priority: P3)

Participants who haven't responded to a poll receive reminder emails before the deadline, sent at configurable intervals (e.g., 24 hours before, 6 hours before, 1 hour before). Emails include the poll title, deadline, time remaining, and a direct link to respond.

**Why this priority**: This improves participation rates but is not essential for the core deadline functionality. Reminders add value but the deadline feature works without them. Can be implemented in a later phase.

**Independent Test**: Can be fully tested by creating a poll with a deadline, adding participants with email addresses, verifying non-responders receive reminder emails at appropriate intervals. This delivers value by increasing participation rates.

**Acceptance Scenarios**:

1. **Given** a poll has a deadline set and participants with email addresses, **When** the deadline is 24 hours away, **Then** participants who haven't voted receive a reminder email
2. **Given** a poll has participants who haven't responded, **When** the deadline is 6 hours away, **Then** non-responders receive a reminder email
3. **Given** a participant receives a reminder email, **When** they view the email, **Then** they see the poll title, deadline date/time, time remaining, and a link to the poll
4. **Given** a participant has already voted, **When** reminder emails are sent, **Then** that participant does not receive a reminder
5. **Given** a poll's deadline has passed, **When** reminder emails are processed, **Then** no reminder emails are sent

---

### Edge Cases

- **Resolved**: Multiple participants with same email address - System sends one reminder email per unique email address, listing all participants with that email
- How does the system handle timezone differences when displaying deadlines to participants in different timezones?
- What happens if the deadline enforcement job fails to run or is delayed?
- How does the system handle polls with deadlines set far in the future (e.g., years)?
- What happens when a poll creator edits a deadline while the deadline enforcement job is running?
- How are reminder emails handled for participants whose email addresses bounce or fail to deliver?
- What happens when a participant's email address is invalid or missing?
- How does the countdown handle daylight saving time transitions?
- What happens when a poll has no participants yet but has a deadline set?
- How does the system prevent duplicate reminder emails if the reminder job runs multiple times?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow poll creators to set an optional deadline (date and time) when creating polls
- **FR-002**: System MUST validate that deadline dates are in the future when setting deadlines
- **FR-003**: System MUST store deadline values in UTC format in the database
- **FR-004**: System MUST display deadline information prominently on poll pages (both participant and admin views)
- **FR-005**: System MUST display deadline in the user's local timezone with timezone indicator
- **FR-006**: System MUST show a real-time countdown displaying time remaining until deadline (days, hours, minutes)
- **FR-007**: System MUST apply visual styling to deadline display based on time remaining (neutral >24h, warning <24h, urgent <6h, disabled when passed)
- **FR-008**: System MUST automatically close polls when their deadline is reached
- **FR-008a**: System MUST send email notification to poll creator when poll is automatically closed at deadline
- **FR-009**: System MUST prevent new votes from being submitted after a poll's deadline has passed
- **FR-010**: System MUST display an error message when users attempt to vote after deadline, showing the deadline date/time
- **FR-011**: System MUST allow viewing of existing votes and poll results after deadline has passed
- **FR-012**: System MUST allow poll creators to edit or remove deadlines on existing polls if the deadline hasn't passed
- **FR-013**: System MUST display deadlines as read-only with "Deadline passed" message if the deadline has already passed
- **FR-014**: System MUST check deadline status when polls are loaded to handle cases where automatic closure may have been missed
- **FR-015**: System MUST send reminder emails to participants who haven't responded before the deadline
- **FR-016**: System MUST send reminders at configurable intervals (default: 24 hours, 6 hours, and 1 hour before deadline)
- **FR-016a**: System MUST send reminders within 1-hour windows before each interval (24-23 hours, 6-5 hours, 1-0 hours before deadline) to align with hourly cron job execution
- **FR-017**: System MUST include in reminder emails: poll title, deadline date/time, time remaining, and direct link to poll
- **FR-018**: System MUST only send reminder emails to participants with valid email addresses
- **FR-018a**: System MUST send one reminder email per unique email address when multiple participants share the same email, listing all associated participants
- **FR-019**: System MUST track sent reminders to prevent duplicate emails
- **FR-020**: System MUST not send reminders after a poll's deadline has passed
- **FR-021**: System MUST display deadline in poll lists/dashboards (optional enhancement - can be P2/P3)

### Key Entities *(include if feature involves data)*

- **Poll**: Represents a scheduling poll with optional deadline field. Deadline is a date/time value stored in UTC. Relationship to deadline enforcement status and reminder tracking.
- **Participant**: Represents a poll participant with optional email address. Relationship to reminder email tracking to prevent duplicates.
- **Reminder**: Represents a sent reminder email, tracking when reminders were sent to which participants for which polls to prevent duplicates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Poll creators can set a deadline when creating a poll in under 30 seconds (deadline field is intuitive and easy to use)
- **SC-002**: 100% of polls with deadlines set display the deadline prominently on poll pages with correct date/time information
- **SC-003**: 100% of polls with passed deadlines automatically close and prevent new votes within 15 minutes of the deadline passing
- **SC-004**: Participants can see time remaining until deadline with countdown updating in real-time (updates every minute)
- **SC-005**: 95% of reminder emails are successfully delivered to participants with valid email addresses
- **SC-006**: Reminder emails increase participation rates by at least 15% compared to polls without reminders (measured for polls with deadlines)
- **SC-007**: Poll creators can edit or remove deadlines on existing polls (when deadline hasn't passed) in under 20 seconds
- **SC-008**: Error messages for voting after deadline are clear and show the deadline date/time in user's timezone
- **SC-009**: System handles timezone conversions correctly, displaying deadlines in each user's local timezone with appropriate timezone indicators
- **SC-010**: Deadline enforcement job completes processing all due polls within 5 minutes of scheduled run time

## Assumptions

- Deadline field already exists in database schema (DateTime?, nullable) - no schema changes needed
- Email infrastructure is already in place for sending reminder emails
- Cron job infrastructure exists for scheduled tasks (similar to existing housekeeping jobs)
- Timezone handling libraries are available for timezone conversions
- Poll status field supports 'paused' or similar status for closed polls
- Existing poll creation and editing flows can be extended with deadline fields
- Reminder email templates follow existing email template patterns in the system

## Dependencies

- Existing poll creation and editing UI components
- Email sending infrastructure
- Cron job/scheduled task system
- Timezone handling utilities
- Database schema with deadline field already present
- Poll status management system

## Out of Scope

- Creating new poll status types (using existing 'paused' status for closed polls)
- Complex reminder email scheduling beyond simple time intervals
- Deadline templates or suggested deadlines
- Automatic deadline suggestions based on poll options
- Deadline analytics or reporting beyond basic display
- Integration with external calendar systems for deadline reminders
- SMS or push notification reminders (email only)
- Deadline extension requests from participants
