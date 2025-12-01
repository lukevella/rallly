# Implementation Plan: Poll UI Enhancements

**Branch**: `001-poll-ui-enhancements` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)

## Summary

This plan implements two independent UI enhancements for Rallly's poll system:

1. **QR Code Sharing (P1)**: Client-side QR code generation using qrcode.react library, displayed in the InviteDialog with download capability for 512x512px PNG files with Medium error correction
2. **Row-per-Date Layout (P2)**: Reorganize date+time poll display to show each date on a separate row with a "None" checkbox for bulk day decline, with bidirectional sync between checkbox and individual time slot buttons

Both features leverage existing Rallly infrastructure (Next.js, TailwindCSS, tRPC, i18n) and follow the project's composability principles.

## Technical Context

**Language/Version**: TypeScript 5.8.2, Node.js 20.x  
**Primary Dependencies**: 
- Next.js 15 with React 19
- qrcode.react (new dependency for QR generation)
- TailwindCSS for styling
- tRPC for API (no new endpoints required)
- Prisma (no schema changes required)
- dayjs for date handling
- react-hook-form + Zod for form state

**Storage**: PostgreSQL with Prisma ORM (existing Vote/Option tables sufficient)  
**Testing**: Vitest for unit tests, Playwright for integration tests  
**Target Platform**: Web (responsive design for desktop and mobile)

**Project Type**: Web application (monorepo structure)

**Performance Goals**: 
- QR code generation: <100ms client-side
- QR code download: <1s for 512x512px PNG
- Row layout render: <200ms for polls with 7 dates × 8 time slots

**Constraints**: 
- Client-side only for QR generation (no server load)
- No database schema changes
- Must maintain backward compatibility with existing poll responses
- All text must be translatable (i18n)

**Scale/Scope**: 
- QR codes for URLs up to 2,000 characters
- Row layout supports up to 20+ time slots per date with horizontal scroll
- Existing vote types (yes/no/ifNeedBe) remain unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md`:

- [x] **Composability & Simplicity**: Both features break down into small, composable components (QRCodeDisplay, QRCodeDownloadButton, DateRow, NoneCheckbox). No unnecessary complexity.
- [x] **Internationalization**: All UI text uses Trans component with i18nKey (e.g., "downloadQrCode", "noneOption", etc.)
- [x] **Type Safety**: TypeScript throughout, Zod schemas for qrcode.react props validation, existing tRPC vote mutations reused
- [x] **Testing**: Unit tests for QR generation logic and checkbox sync logic; Playwright tests for user journeys
- [x] **Modern UI Standards**: TailwindCSS with cn(), icons wrapped in <Icon>, dayjs for dates, "use client" directive where needed
- [x] **Development Standards**: kebab-case files (qr-code-display.tsx, date-row-layout.tsx), double quotes, pnpm, packages/ui for shared components
- [x] **Quality Assurance**: Pre-commit checks, i18n:scan for translation keys, no Prisma migrations needed

**Complexity Justification**: No violations. Both features use simple, composable patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-poll-ui-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output (qrcode.react API, layout patterns)
├── data-model.md        # Phase 1 output (UI state, no DB changes)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (component interfaces)
└── spec.md              # Original specification
```

### Source Code (repository root)

**Monorepo Structure** (Web application - apps/web + packages/ui):

```text
apps/web/src/
├── components/
│   ├── poll/
│   │   ├── qr-code-display.tsx          # NEW: QR code component
│   │   ├── desktop-poll.tsx             # MODIFIED: Add row-per-date layout
│   │   ├── desktop-poll/
│   │   │   ├── date-row.tsx             # NEW: Date row with None checkbox
│   │   │   ├── date-row-header.tsx      # NEW: Date header for row layout
│   │   │   └── participant-row.tsx      # MODIFIED: Support row layout
│   │   └── mobile-poll/
│   │       └── poll-options.tsx         # MODIFIED: Add None checkbox for mobile
│   └── invite-dialog.tsx                # MODIFIED: Add QR code section

packages/ui/src/
├── checkbox.tsx                          # EXISTING: Reuse for None option
└── (other existing UI components)

apps/web/tests/
└── poll-ui-enhancements.spec.ts         # NEW: Integration tests

# Translations (auto-generated via pnpm i18n:scan)
public/locales/en/
└── app.json                              # MODIFIED: New i18n keys added
```

**Structure Decision**: Using Option 2 (Web application) from template. Feature code lives in `apps/web/src/components/poll/` for poll-specific components, with potential shared UI primitives in `packages/ui/` if needed. No backend changes required as QR generation is client-side and row layout is purely presentational.

## Complexity Tracking

No violations - both features align with simplicity principles:
- QR code: Single composable component using existing library
- Row layout: Reorganization of existing vote UI with checkbox component

---

## Phase 0: Research - ✅ COMPLETE

See [research.md](./research.md) for full details.

**Key Decisions**:
- QR library component: QRCodeCanvas (easier PNG export)
- QR error correction: Medium (M) - 15% recovery
- Layout strategy: Conditional rendering based on poll type
- None checkbox: Controlled component with useEffect for bidirectional sync
- Download approach: Canvas.toBlob() for PNG generation

---

## Phase 1: Design & Contracts - ✅ COMPLETE

### Artifacts Generated

1. **[data-model.md](./data-model.md)**: UI state models and component interfaces
   - No database changes required
   - QRCodeDisplay state and props
   - DateRow state with bidirectional checkbox sync
   - Poll layout determination logic

2. **[contracts/qr-code-display.md](./contracts/qr-code-display.md)**: QR code component specification
   - Props interface and behavior
   - Download flow implementation
   - Testing strategy
   - Accessibility requirements

3. **[contracts/date-row.md](./contracts/date-row.md)**: Date row component specification
   - Props interface and behavior
   - None checkbox bidirectional sync logic
   - Responsive design patterns
   - Edge case handling

4. **[quickstart.md](./quickstart.md)**: Developer implementation guide
   - Step-by-step implementation for both features
   - Code examples and file structures
   - Testing and deployment workflows
   - Troubleshooting guide

### Constitution Re-Check

All principles remain compliant:
- ✅ Composability: Small, focused components (QRCodeDisplay, DateRow, TimeSlotButton)
- ✅ i18n: All text uses Trans component with proper keys
- ✅ Type Safety: Full TypeScript coverage, no any types
- ✅ Testing: Comprehensive unit and integration test strategy
- ✅ Modern UI: TailwindCSS, cn(), Icon component, proper React patterns

---

## Implementation Summary

### Feature 1: QR Code Sharing (P1)

**Files to Create**:
- `apps/web/src/components/poll/qr-code-display.tsx` - Main QR component
- `apps/web/tests/qr-code-sharing.spec.ts` - Integration tests

**Files to Modify**:
- `apps/web/src/components/invite-dialog.tsx` - Add QR section
- `package.json` - Add qrcode.react dependency

**Dependencies Added**:
- `qrcode.react` (client-side QR generation)

### Feature 2: Row-per-Date Layout (P2)

**Files to Create**:
- `apps/web/src/components/poll/group-by-date.ts` - Helper functions
- `apps/web/src/components/poll/desktop-poll/date-row.tsx` - Date row component
- `apps/web/src/components/poll/desktop-poll/time-slot-button.tsx` - Time slot button
- `apps/web/tests/date-row-layout.spec.ts` - Integration tests

**Files to Modify**:
- `apps/web/src/components/poll/desktop-poll.tsx` - Add conditional row layout
- `apps/web/src/components/poll/mobile-poll/poll-options.tsx` - Mobile row support

**Dependencies**: No new dependencies (uses existing Rallly infrastructure)

### i18n Keys Required

**QR Code Feature**:
- `downloadQrCode`: "Download QR Code"
- `qrCode`: "QR Code"
- `qrCodeDescription`: "Share this QR code..."
- `qrCodeError`: "Failed to generate QR code..."

**Row Layout Feature**:
- `noneOption`: "None"
- `noneOptionDescription`: "Not available this day"
- `voteYes`: "Available"
- `voteNo`: "Not available"
- `voteIfNeedBe`: "If need be"

*Note: Keys will be auto-extracted via `pnpm i18n:scan`*

### Database Changes

**NONE** - Both features are purely UI/client-side.

### API Changes

**NONE** - Uses existing tRPC `participants.update` mutation for vote changes.

### Performance Targets

- QR generation: < 100ms (client-side, library handles optimization)
- QR download: < 1s for 512x512px PNG
- Row layout render: < 200ms for 7 dates × 8 time slots
- None checkbox sync: Instant (< 16ms, one React render cycle)

---

## Next Steps

**Phase 2: Implementation** - Use `/speckit.tasks` command

This will generate `tasks.md` with:
- Detailed task breakdown for both user stories
- Parallel execution opportunities
- Testing tasks per user story
- Clear checkpoints for independent delivery

**Recommended Order**:
1. Implement QR Code Sharing (P1) first - simpler, independent
2. Test and validate QR code feature
3. Implement Row-per-Date Layout (P2)
4. Test and validate row layout feature
5. Integration testing for both features together

---

**End of Planning Phase - Ready for Task Breakdown**
