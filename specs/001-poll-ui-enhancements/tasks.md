# Tasks: Poll UI Enhancements

**Input**: Design documents from `/specs/001-poll-ui-enhancements/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are OPTIONAL for this feature. Integration tests are included for validation but can be implemented after core functionality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/web/src/`, `packages/ui/src/` for shared components
- **Tests**: `apps/web/tests/` for integration tests
- Paths shown below use repository structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency management

- [ ] T001 Install qrcode.react dependency in package.json
- [ ] T002 [P] Run pnpm install to update dependencies
- [ ] T003 [P] Verify qrcode.react types are available (@types/qrcode.react if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create date grouping helper function in apps/web/src/components/poll/group-by-date.ts
- [ ] T005 [P] Add unit test for groupOptionsByDate function (if tests requested)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - QR Code Sharing (Priority: P1) 🎯 MVP

**Goal**: Poll owners can generate and download QR codes for their poll invite URLs for physical sharing

**Independent Test**: Create a poll, open share dialog, verify QR code displays, click download, verify PNG file downloads, scan QR code with mobile device

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create QRCodeDisplay component in apps/web/src/components/poll/qr-code-display.tsx
- [ ] T007 [US1] Modify InviteDialog to add QR code section in apps/web/src/components/invite-dialog.tsx
- [ ] T008 [US1] Add error handling and retry logic to QRCodeDisplay component
- [ ] T009 [US1] Add i18n keys for QR code feature (downloadQrCode, qrCode, qrCodeDescription, qrCodeError)
- [ ] T010 [US1] Run pnpm i18n:scan to extract translation keys

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

**Validation**:
1. Open a poll as owner
2. Click "Share" button
3. Verify QR code displays in dialog with invite URL encoded
4. Click "Download QR Code" button
5. Verify rallly-poll-{pollId}-qr.png (512x512px) downloads
6. Scan QR code with mobile device
7. Verify it opens the poll invite URL

---

## Phase 4: User Story 2 - Row-per-Date Layout (Priority: P2)

**Goal**: Participants can view date+time polls in row-per-date layout with "None" checkbox for bulk day decline

**Independent Test**: Create a poll with dates and times, view as participant, verify each date shows on separate row, click "None" for a date, verify all time slots marked as "No", click a time slot to select "Yes", verify "None" unchecks

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create TimeSlotButton component in apps/web/src/components/poll/desktop-poll/time-slot-button.tsx
- [ ] T012 [P] [US2] Create DateRow component in apps/web/src/components/poll/desktop-poll/date-row.tsx
- [ ] T013 [US2] Modify DesktopPoll to add conditional row layout in apps/web/src/components/poll/desktop-poll.tsx
- [ ] T014 [US2] Add useMemo for date grouping and vote map transformations in DesktopPoll
- [ ] T015 [US2] Implement None checkbox bidirectional sync logic in DateRow component
- [ ] T016 [US2] Add responsive horizontal scroll for time slots in DateRow component
- [ ] T017 [US2] Modify MobilePoll to support row layout in apps/web/src/components/poll/mobile-poll/poll-options.tsx
- [ ] T018 [US2] Add i18n keys for row layout feature (noneOption, noneOptionDescription, voteYes, voteNo, voteIfNeedBe)
- [ ] T019 [US2] Run pnpm i18n:scan to extract translation keys

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

**Validation**:
1. Create a poll with dates AND times (e.g., "Dec 2 at 12:00, 1:00" and "Dec 3 at 12:00, 1:00")
2. View poll as participant
3. Verify each date displays on separate row
4. Verify "None" checkbox at beginning of each row
5. Check "None" for Dec 2
6. Verify all Dec 2 time slots show "No" state
7. Click Dec 2 1:00 PM slot to select "Yes"
8. Verify "None" checkbox unchecks for Dec 2
9. Individually mark all Dec 3 slots as "No"
10. Verify "None" checkbox auto-checks for Dec 3

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 [P] Add unit tests for QRCodeDisplay component in apps/web/src/components/poll/qr-code-display.test.tsx (optional)
- [ ] T021 [P] Add unit tests for DateRow component in apps/web/src/components/poll/desktop-poll/date-row.test.tsx (optional)
- [ ] T022 [P] Add integration test for QR code download in apps/web/tests/qr-code-sharing.spec.ts (optional)
- [ ] T023 [P] Add integration test for row layout in apps/web/tests/date-row-layout.spec.ts (optional)
- [ ] T024 [P] Run pnpm check:fix to lint all files
- [ ] T025 [P] Run pnpm type-check to verify TypeScript types
- [ ] T026 [P] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] T027 [P] Test with large polls (20+ time slots per date)
- [ ] T028 [P] Verify accessibility (keyboard navigation, screen readers)
- [ ] T029 Run quickstart.md validation steps for both features
- [ ] T030 Final end-to-end testing of both features together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T003) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (T004-T005)
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (T004-T005)
- **Polish (Phase 5)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories

**INDEPENDENT DELIVERY**: Both user stories can be implemented, tested, and deployed independently

### Within Each User Story

**User Story 1 (QR Code)**:
1. T006: Create QRCodeDisplay component (foundation)
2. T007: Integrate into InviteDialog (depends on T006)
3. T008: Add error handling (depends on T006)
4. T009-T010: i18n (can be done anytime after T006-T007)

**User Story 2 (Row Layout)**:
1. T011-T012: Create TimeSlotButton and DateRow components (parallel)
2. T013-T014: Integrate into DesktopPoll (depends on T011-T012)
3. T015-T016: Add sync logic and scroll (depends on T012-T013)
4. T017: Mobile support (depends on T011-T012)
5. T018-T019: i18n (can be done anytime after T011-T017)

### Parallel Opportunities

- **Setup**: All tasks (T001-T003) can run in parallel
- **Foundational**: T004 and T005 can run in parallel
- **User Story 1**: T006 can run while T007 is being planned
- **User Story 2**: T011 and T012 can run in parallel
- **Polish**: All test tasks (T020-T023) and validation tasks (T024-T028) can run in parallel
- **Cross-Story**: US1 and US2 can be worked on by different developers in parallel after Foundational phase

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch US1 tasks:
Task T006: "Create QRCodeDisplay component in apps/web/src/components/poll/qr-code-display.tsx"
# Then:
Task T007: "Modify InviteDialog in apps/web/src/components/invite-dialog.tsx"
Task T008: "Add error handling to QRCodeDisplay"
# Finally:
Task T009-T010: "Add and extract i18n keys"
```

---

## Parallel Example: User Story 2

```bash
# After Foundational phase completes, launch US2 tasks in parallel:
Task T011: "Create TimeSlotButton in apps/web/src/components/poll/desktop-poll/time-slot-button.tsx"
Task T012: "Create DateRow in apps/web/src/components/poll/desktop-poll/date-row.tsx"
# Once T011-T012 complete, proceed to integration:
Task T013-T014: "Modify DesktopPoll with conditional layout and memoization"
Task T015-T016: "Add None checkbox sync and horizontal scroll"
Task T017: "Add mobile support in poll-options.tsx"
# Finally:
Task T018-T019: "Add and extract i18n keys"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Fastest Path to Value**:

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Test QR code feature independently
5. Deploy/demo if ready

**Deliverable**: Poll owners can generate and download QR codes for physical sharing

### Incremental Delivery

**Recommended Approach**:

1. **Milestone 1**: Setup + Foundational → Foundation ready
2. **Milestone 2**: Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. **Milestone 3**: Add User Story 2 → Test independently → Deploy/Demo
4. **Milestone 4**: Polish phase → Final validation → Full release

Each milestone adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T005)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T006-T010) - QR code feature
   - Developer B: User Story 2 (T011-T019) - Row layout feature
3. **Stories complete and integrate independently**
4. **Team collaborates on Polish phase** (T020-T030)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests (T020-T023) are optional but recommended for regression prevention
- Run `pnpm i18n:scan` after adding any Trans components (T010, T019)
- Run `pnpm check:fix` and `pnpm type-check` before committing (T024-T025)

---

## Task Summary

**Total Tasks**: 30
- Setup: 3 tasks
- Foundational: 2 tasks  
- User Story 1 (P1): 5 tasks
- User Story 2 (P2): 9 tasks
- Polish: 11 tasks (8 optional tests/validation)

**Parallel Opportunities**: 15 tasks marked with [P]

**Independent Test Criteria**:
- **US1**: Poll owner can download 512x512px QR code PNG and scan it to access poll
- **US2**: Participant can use "None" checkbox to decline entire day in one click

**Suggested MVP Scope**: User Story 1 only (T001-T010) - Delivers immediate value for physical sharing

**Estimated Effort**:
- MVP (US1): ~4-6 hours (Setup → Foundational → US1)
- Full Feature (US1 + US2): ~12-16 hours (including polish)
- With Tests: +4-6 hours (optional)

**Format Validation**: ✅ All tasks follow required checklist format with ID, labels, and file paths

