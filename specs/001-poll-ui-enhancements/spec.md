# Feature Specification: Poll UI Enhancements

**Feature Branch**: `001-poll-ui-enhancements`  
**Created**: 2025-12-01  
**Status**: Draft  
**Input**: User description: "We want to build out two features to this existing application called Rallly. For context, this application is a meeting scheduling application that allows users to create polls to find the best meeting times. Once the polls are finalized then it allows you to create an event. If an email is provided it will email this out and allow you to add the event to your calendar. Here are the features i want to build out: 1. I want to allow the owner of the poll to generate a QR code that enocdes the poll invite URL. The QR code should be display on the admin/share page and should be downloadable so that the png file could be displayed on printed materials or a powerpoint. You can reference the image provided for how it should look. 2. When you create a poll that includes dates and times the UI shows a full scrollbar with all the dates and time options. I want to break it down that ONLY for this option where there are times & dates we show each date on a seperate line and allow the full day to be declined. Refer to mock up attached on proposed behavior . When you click no for the full day all the time slots should take the same poll"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - QR Code Sharing (Priority: P1)

Poll owners need a quick way to share poll invites in physical spaces (meetings, presentations, printed flyers) without requiring participants to type long URLs. The QR code generation feature allows poll owners to display and download a scannable code that encodes the poll invite URL.

**Why this priority**: This is the simpler feature to implement and provides immediate value for in-person event coordination. It's independently useful regardless of the date/time layout improvements.

**Independent Test**: Can be fully tested by creating a poll, navigating to the admin/share page, viewing the QR code, downloading it as PNG, and scanning it with a mobile device to verify it opens the correct poll URL.

**Acceptance Scenarios**:

1. **Given** a poll owner is on the admin/share page, **When** they view the page, **Then** they see a QR code displayed that encodes the poll invite URL
2. **Given** a poll owner sees the QR code on the admin/share page, **When** they click the download/save button, **Then** a PNG file of the QR code is downloaded to their device
3. **Given** a participant scans the downloaded QR code with their mobile device, **When** the QR code is scanned, **Then** they are directed to the poll invite URL where they can participate
4. **Given** a poll owner wants to include the QR code in a presentation, **When** they insert the downloaded PNG file, **Then** the QR code is clearly readable and maintains proper quality

---

### User Story 2 - Row-per-Date Layout with Full Day Decline (Priority: P2)

When participants view polls with multiple dates and times, the current horizontal scroll layout makes it difficult to quickly decline entire days. The improved layout displays each date on a separate row with all time slots for that date visible, and includes a "None" option to decline all times for a specific date at once.

**Why this priority**: This is a more complex UI change that improves usability for a specific poll type (date + time). It builds on the existing poll infrastructure and requires more careful UX design.

**Independent Test**: Can be fully tested by creating a poll with dates and times, viewing it as a participant, selecting "None" for a specific date, and verifying all time slots for that date are marked as declined.

**Acceptance Scenarios**:

1. **Given** a participant views a poll with dates and times, **When** the poll loads, **Then** each date is displayed on a separate row with all time slots for that date shown horizontally
2. **Given** a participant sees a date row, **When** they look at the available options, **Then** they see a "None" option at the beginning of the row to decline the entire day
3. **Given** a participant clicks "None" for a specific date, **When** the selection is made, **Then** all time slots for that date are automatically marked as "No"
4. **Given** a participant has selected "None" for a date, **When** they later change their mind and click on a specific time slot to select "Yes" or "If need be", **Then** the "None" selection is deselected and the specific time slot response is recorded
5. **Given** a participant has individually declined all time slots for a date, **When** the system evaluates the selections, **Then** the "None" option is automatically checked to reflect the state
6. **Given** a poll has only dates without times, **When** the poll is displayed, **Then** the original layout is maintained (this feature only applies to polls with both dates AND times)

---

### Edge Cases

- What happens when the poll invite URL is very long (e.g., contains complex query parameters)? The QR code should still generate correctly but may have higher density.
- What happens when a participant is on a mobile device viewing the row-per-date layout? The layout should be responsive and show dates as rows with horizontal scrolling for time slots if needed.
- What happens when a date has many time slots (e.g., 20+ slots in a day)? The row should support horizontal scrolling to show all times while keeping the date and "None" checkbox visible.
- What happens when downloading the QR code fails (network error, permission issue)? The user should see an error message and be able to retry.
- What happens when a poll owner shares the QR code but later changes the poll URL? The QR code becomes invalid and would need to be regenerated.
- What happens when a participant rapidly clicks between "None" checkbox and individual time slot buttons? The UI should handle rapid state changes gracefully with proper debouncing or state management.
- What happens when time slot styled buttons have different visual states for "Yes", "No", and "If need be"? The "None" checkbox should only affect the response state, not override custom button styling.

## Requirements *(mandatory)*

### Functional Requirements

#### QR Code Generation

- **FR-001**: System MUST generate a QR code that encodes the poll invite URL with Medium (M) error correction level (15% error recovery)
- **FR-002**: System MUST display the generated QR code on the admin/share page for poll owners
- **FR-003**: System MUST provide a download/save button to export the QR code as a PNG file
- **FR-004**: Downloaded QR code PNG files MUST be sized at 512x512px (suitable for presentations and digital sharing)
- **FR-005**: QR code MUST be scannable by standard QR code readers on mobile devices
- **FR-006**: QR code feature MUST only be visible to poll owners (not participants viewing the poll)

#### Row-per-Date Layout

- **FR-007**: System MUST display polls with dates AND times using a row-per-date layout (one row for each date)
- **FR-008**: System MUST display all time slots for a date horizontally within that date's row as styled buttons
- **FR-009**: System MUST display a "None" option as a checkbox at the beginning of each date row
- **FR-010**: System MUST mark all time slots as "No" when the "None" checkbox is checked for a date, overriding any existing "Yes" or "If need be" responses and updating all time slot styled buttons to reflect "No" state
- **FR-011**: System MUST uncheck the "None" checkbox when a participant clicks any time slot styled button to select "Yes" or "If need be" for that date
- **FR-012**: System MUST automatically check the "None" checkbox when all time slot styled buttons for a date are individually set to "No"
- **FR-013**: System MUST only apply row-per-date layout to polls that have BOTH dates and times (polls with only dates use the original layout)
- **FR-014**: System MUST preserve participant responses when switching between viewing modes
- **FR-015**: System MUST maintain bidirectional synchronization between the "None" checkbox state and time slot styled button states

### Key Entities

- **Poll**: The scheduling poll that contains dates, times, and participant responses. Has an invite URL and is owned by a user.
- **QR Code**: Visual representation encoding the poll invite URL. Can be displayed and downloaded as an image file.
- **Date Option**: A specific date in the poll. In date+time polls, contains multiple time slots.
- **Time Slot**: A specific time within a date. Participants can respond with "Yes", "No", or "If need be".
- **Participant Response**: A participant's availability selection for specific date/time combinations. Can be "Yes" (available), "No" (not available), or "If need be" (available if necessary).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Poll owners can generate and download a QR code for their poll in under 10 seconds
- **SC-002**: QR codes are scannable with 100% success rate on standard mobile QR readers (iOS Camera, Android Camera, QR scanner apps)
- **SC-003**: Participants can decline an entire day (8+ time slots) in one action instead of 8+ individual clicks, reducing selection time by at least 75%
- **SC-004**: Row-per-date layout displays all dates and times without requiring vertical scrolling for polls with up to 7 dates
- **SC-005**: 90% of poll owners successfully locate and use the QR code download feature without assistance
- **SC-006**: Downloaded QR code images maintain scannable quality when printed at standard presentation sizes (8.5x11" slides)
- **SC-007**: The "None" option behavior (auto-selecting/deselecting based on time slot selections) is understood by 95% of participants on first use

## Clarifications

### Session 2025-12-01

- Q: Should QR code generation happen client-side or server-side? → A: Client-side using qrcode.react library
- Q: What are the possible states for a participant's response to a time slot? → A: Three states: Yes, No, If need be
- Q: When "None" is clicked for a date, what happens to existing "Yes" or "If need be" responses for time slots on that date? → A: Override all - Change all existing responses to "No"
- Q: What error correction level should the QR code use? → A: Medium (M) - 15% error recovery
- Q: How should the "None" option be presented visually in the UI? → A: Checkbox that syncs bidirectionally with styled buttons for time slots (checking "None" updates all time slot buttons to "No", unchecking any time slot button updates the "None" checkbox state)

## Assumptions

- Poll owners have access to an admin/share page that is distinct from the participant poll view
- The poll invite URL is stable and does not change after poll creation (or changes invalidate the QR code)
- Participants are familiar with QR codes and have devices capable of scanning them
- The current poll UI uses a horizontal scroll layout for date+time polls
- QR code generation happens client-side using the qrcode.react library
- PNG is the preferred format for image download (could be extended to SVG, JPEG later)
- "None" is an acceptable label for declining all times in a day (could be localized or changed to "Not Available" etc.)
- The row-per-date layout improvement applies only when BOTH dates and times are present, not to date-only or time-only polls
