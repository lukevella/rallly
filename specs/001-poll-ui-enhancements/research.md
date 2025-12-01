# Research: Poll UI Enhancements

**Date**: 2025-12-01  
**Phase**: 0 - Technical Research

## Purpose

Research technical approaches for:
1. QR code generation using qrcode.react library
2. Row-per-date layout patterns for polls with dates and times
3. Checkbox-button bidirectional state synchronization

## 1. QR Code Generation with qrcode.react

### Library Overview

**Source**: [qrcode.react documentation](https://context7.com/zpao/qrcode.react/llms.txt)

qrcode.react provides two React components for QR code generation:
- `QRCodeSVG`: Renders QR code as SVG (scalable, but harder to download as PNG)
- `QRCodeCanvas`: Renders QR code on HTML Canvas (easier to convert to PNG for download)

### Decision: Use QRCodeCanvas

**Rationale**: 
- Requirement FR-003 mandates PNG download capability
- Canvas API provides `toDataURL()` and `toBlob()` methods for easy PNG export
- 512x512px size requirement is fixed, so scalability advantage of SVG is not needed

**Implementation approach**:
```tsx
import { QRCodeCanvas } from "qrcode.react";

<QRCodeCanvas
  value={pollInviteUrl}
  size={512}
  level="M"          // Medium error correction (15% recovery)
  bgColor="#FFFFFF"
  fgColor="#000000"
  includeMargin={false}
  marginSize={4}     // 4 modules as per QR spec
/>
```

### PNG Download Strategy

**Approach**: Use Canvas.toBlob() API

```tsx
const downloadQRCode = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `rallly-poll-${pollId}-qr.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
```

**Alternatives considered**:
- `toDataURL()`: Simpler but less memory efficient for large images
- Server-side generation: Rejected per clarification (client-side required)
- SVG download: Rejected because PNG is required format

### Error Correction Level

**Decision**: Level "M" (Medium - 15% recovery)

Per clarification, Medium provides good balance:
- Recovers up to 15% data damage
- Suitable for typical printing and scanning scenarios
- Not too dense for 512x512px size with typical URL lengths

**QRProps interface**:
```ts
type QRCodeProps = {
  value: string;           // poll invite URL
  size: number;            // 512
  level: 'M';              // Medium error correction
  bgColor: string;         // '#FFFFFF'
  fgColor: string;         // '#000000'
  marginSize: number;      // 4 (QR spec requirement)
};
```

## 2. Row-per-Date Layout

### Current Layout Analysis

**Source**: `apps/web/src/components/poll/desktop-poll.tsx`

Current layout for date+time polls:
- Horizontal scroll table
- Column headers show all dates and times in one row
- Each participant is a table row with votes across all date/time combinations
- Uses `<PollHeader />` component to render option headers

### New Layout Pattern

**Decision**: Conditional rendering based on poll type

```tsx
// Determine if poll has both dates and times
const hasDatesAndTimes = poll.options.some(opt => opt.duration > 0);

if (hasDatesAndTimes) {
  return <DateRowLayout />;  // New component
} else {
  return <TraditionalLayout />;  // Existing horizontal scroll
}
```

### Date Grouping Strategy

**Approach**: Group options by date

```tsx
// Group options by date
const optionsByDate = poll.options.reduce((acc, option) => {
  const dateKey = dayjs(option.startTime).format('YYYY-MM-DD');
  if (!acc[dateKey]) {
    acc[dateKey] = [];
  }
  acc[dateKey].push(option);
  return acc;
}, {} as Record<string, Option[]>);

// Render each date as a row
Object.entries(optionsByDate).map(([date, options]) => (
  <DateRow
    key={date}
    date={date}
    options={options}
    participant={participant}
  />
));
```

### None Checkbox Implementation

**Decision**: Controlled checkbox with useEffect for sync

**Approach**:
```tsx
const DateRow = ({ date, options, participant }) => {
  const votes = options.map(opt => getVote(participant.id, opt.id));
  const allNo = votes.every(v => v?.type === 'no');
  const [noneChecked, setNoneChecked] = React.useState(allNo);
  
  // Sync checkbox when all votes are 'no'
  React.useEffect(() => {
    setNoneChecked(allNo);
  }, [allNo]);
  
  const handleNoneChange = (checked: boolean) => {
    if (checked) {
      // Set all time slots to 'no'
      options.forEach(opt => updateVote(opt.id, 'no'));
    }
  };
  
  const handleSlotChange = (optionId: string, type: VoteType) => {
    if (type !== 'no') {
      setNoneChecked(false);  // Uncheck None if selecting Yes/IfNeedBe
    }
    updateVote(optionId, type);
  };
};
```

**Alternatives considered**:
- Derived state only (no useState): Rejected because causes flicker on rapid clicks
- Radio button group: Rejected per user requirement (checkbox specified)
- Separate "Clear All" button: Rejected in favor of inline checkbox UX

## 3. State Synchronization Pattern

### Bidirectional Sync Strategy

**Decision**: Checkbox reflects vote state, clicking checkbox updates all votes

**Key behaviors**:
1. **None → Slots**: Checking "None" sets all slots to "no" (overrides existing "yes"/"ifNeedBe")
2. **Slots → None**: Selecting any "yes"/"ifNeedBe" unchecks "None"
3. **Auto-check None**: When all slots individually set to "no", "None" auto-checks

```tsx
// State flow diagram:
//
// [User checks "None"]
//   → setAllVotesToNo()
//   → noneChecked = true
//
// [User clicks time slot to "yes" or "ifNeedBe"]
//   → setNoneChecked(false)
//   → updateVote(optionId, type)
//
// [User sets all slots to "no" individually]
//   → useEffect detects allNo === true
//   → setNoneChecked(true)
```

### Debouncing Consideration

**Decision**: No explicit debouncing needed

**Rationale**:
- React's batching handles rapid setState calls efficiently
- Vote updates are already debounced by form submission flow
- Checkbox toggle is instant user feedback (should not be debounced)

## 4. Mobile Responsive Strategy

### Mobile Layout Pattern

**Source**: `apps/web/src/components/poll/mobile-poll/poll-options.tsx`

Mobile uses vertical list of options instead of table. Each option is a card.

**Decision**: Add "None" checkbox to mobile date groups

**Approach**:
- Group mobile options by date (same logic as desktop)
- Render date header with "None" checkbox before time slots
- Reuse same bidirectional sync logic
- Use TailwindCSS responsive classes for horizontal scroll on small screens

```tsx
// Mobile date group
<div className="space-y-2">
  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
    <Checkbox checked={noneChecked} onCheckedChange={handleNoneChange} />
    <span className="text-sm font-medium">{formatDate(date)}</span>
    <span className="text-xs text-muted-foreground">None</span>
  </div>
  <div className="flex gap-2 overflow-x-auto px-4">
    {timeSlots.map(slot => <TimeSlotButton {...slot} />)}
  </div>
</div>
```

## 5. Internationalization (i18n)

### New Translation Keys Required

**Approach**: Use `pnpm i18n:scan` to extract keys after implementation

**Keys needed**:
- `downloadQrCode`: "Download QR Code"
- `qrCodeTitle`: "QR Code"
- `qrCodeDescription`: "Scan this code to vote"
- `noneOption`: "None"
- `noneOptionDescription`: "Not available this day"
- `declineAllTimesForDate`: "Decline all times for {date}"

**Component usage**:
```tsx
<Trans i18nKey="downloadQrCode" defaults="Download QR Code" />
<Trans 
  i18nKey="declineAllTimesForDate" 
  values={{ date: formatDate(date) }}
  defaults="Decline all times for {date}" 
/>
```

## 6. Integration with Existing Infrastructure

### Reusing Existing Components

**Components to reuse**:
- `packages/ui/src/checkbox.tsx`: For "None" option
- `packages/ui/src/button.tsx`: For QR download button
- `@rallly/ui/icon`: For download icon
- `apps/web/src/components/trans.tsx`: For all i18n text
- `apps/web/src/utils/dayjs.ts`: For date formatting

### Vote Mutation Reuse

**No new tRPC endpoints needed**

Existing mutation: `participants.update` handles vote changes:
```ts
// apps/web/src/trpc/routers/polls/participants.ts
update: publicProcedure
  .input(
    z.object({
      pollId: z.string(),
      participantId: z.string(),
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
  )
```

When "None" is checked, we just call this mutation with all optionIds for that date set to type: "no".

## 7. Testing Strategy

### Unit Tests (Vitest)

**Test files**:
- `apps/web/src/components/poll/qr-code-display.test.tsx`
- `apps/web/src/components/poll/desktop-poll/date-row.test.tsx`

**Test cases**:
1. QR code renders with correct value and size
2. QR code download triggers blob creation
3. None checkbox reflects vote state correctly
4. Checking None sets all votes to "no"
5. Unchecking any time slot unchecks None
6. All slots "no" auto-checks None

### Integration Tests (Playwright)

**Test file**: `apps/web/tests/poll-ui-enhancements.spec.ts`

**Test scenarios**:
1. Poll owner opens InviteDialog, sees QR code, downloads PNG
2. Participant views date+time poll, sees row-per-date layout
3. Participant checks "None" for a date, all slots update to "no"
4. Participant unchecks one slot, "None" unchecks
5. Mobile responsive layout works with horizontal scroll

## Summary

### Decisions Made

| Area | Decision | Rationale |
|------|----------|-----------|
| QR Library Component | QRCodeCanvas | Easier PNG export via Canvas API |
| QR Error Correction | Medium (M) | 15% recovery, good balance per spec |
| Layout Strategy | Conditional rendering | Only apply row layout when dates+times present |
| Date Grouping | dayjs format('YYYY-MM-DD') | Group options by date key |
| None Checkbox | Controlled component with useEffect | Bidirectional sync with vote state |
| Mobile Layout | Same row logic, horizontal scroll | Consistent UX across devices |
| Download Approach | Canvas.toBlob() | Memory efficient, native browser support |
| i18n Approach | Trans component + i18n:scan | Follow existing Rallly patterns |
| Testing | Vitest + Playwright | Unit tests for logic, E2E for user flows |

### No Unresolved Questions

All technical approaches are clear and aligned with existing Rallly infrastructure. Ready to proceed to Phase 1 (Design & Contracts).

