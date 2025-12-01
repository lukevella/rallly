# Quick Start: Poll UI Enhancements

**Date**: 2025-12-01  
**Phase**: 1 - Developer Guide

## Overview

This guide walks through implementing both poll UI enhancements:
1. QR Code Sharing (Priority P1 - implement first)
2. Row-per-Date Layout (Priority P2 - implement second)

Both features are independent and can be developed/tested separately.

## Prerequisites

- Node.js 20.x installed
- pnpm package manager
- Rallly development environment set up (see [CLAUDE.md](../../../CLAUDE.md))
- Git branch `001-poll-ui-enhancements` checked out

## Installation Steps

### 1. Install Dependencies

```bash
# Install qrcode.react library
pnpm add qrcode.react

# Install type definitions if needed
pnpm add -D @types/qrcode.react
```

### 2. Verify Existing Dependencies

These are already installed in Rallly - verify they're available:

```bash
# Check package.json includes:
# - react 19.x
# - next 15.x
# - @rallly/ui (internal package)
# - dayjs
# - lucide-react (for icons)
```

## Feature 1: QR Code Sharing (P1)

### Step 1.1: Create QR Code Display Component

**File**: `apps/web/src/components/poll/qr-code-display.tsx`

```tsx
"use client";
import * as React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Alert } from "@rallly/ui/alert";
import { DownloadIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { cn } from "@rallly/ui";

export interface QRCodeDisplayProps {
  url: string;
  pollId: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  className?: string;
}

export function QRCodeDisplay({
  url,
  pollId,
  size = 512,
  level = "M",
  className,
}: QRCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not found");
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to generate PNG");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `rallly-poll-${pollId}-qr.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex justify-center rounded-lg border bg-white p-4">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={size}
          level={level}
          bgColor="#FFFFFF"
          fgColor="#000000"
          marginSize={4}
          aria-label="QR code for poll invitation"
        />
      </div>

      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full"
      >
        <Icon>
          <DownloadIcon />
        </Icon>
        <Trans i18nKey="downloadQrCode" defaults="Download QR Code" />
      </Button>

      {error && (
        <Alert variant="destructive">
          <Trans
            i18nKey="qrCodeError"
            defaults="Failed to generate QR code. Please try again."
          />
        </Alert>
      )}
    </div>
  );
}
```

### Step 1.2: Integrate into InviteDialog

**File**: `apps/web/src/components/invite-dialog.tsx` (modify existing)

```tsx
// Add import
import { QRCodeDisplay } from "@/components/poll/qr-code-display";

// Inside InviteDialog component, add QR code section after invite link:
export const InviteDialog = () => {
  const { participants } = useParticipants();
  const [isOpen, setIsOpen] = React.useState(participants.length === 0);
  const poll = usePoll();
  
  // Generate invite URL
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${poll.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild={true}>
        {/* ... existing trigger ... */}
      </DialogTrigger>
      <DialogContent data-testid="invite-participant-dialog">
        {/* ... existing header ... */}
        
        {/* Existing invite link section */}
        <div className="min-w-0">
          {/* ... existing link ... */}
        </div>

        {/* NEW: QR Code Section */}
        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">
            <Trans i18nKey="qrCode" defaults="QR Code" />
          </p>
          <p className="mb-4 text-muted-foreground text-sm">
            <Trans
              i18nKey="qrCodeDescription"
              defaults="Share this QR code in presentations or print it for physical distribution."
            />
          </p>
          <QRCodeDisplay url={inviteUrl} pollId={poll.id} />
        </div>

        {/* ... existing description ... */}
      </DialogContent>
    </Dialog>
  );
};
```

### Step 1.3: Add Translations

**Run i18n scan** to extract new keys:

```bash
pnpm i18n:scan
```

This will automatically add these keys to `public/locales/en/app.json`:
- `downloadQrCode`
- `qrCode`
- `qrCodeDescription`
- `qrCodeError`

### Step 1.4: Test QR Code Feature

**Manual testing**:
1. Start dev server: `pnpm dev`
2. Create or open a poll
3. Click "Share" button
4. Verify QR code displays in dialog
5. Click "Download QR Code"
6. Verify PNG file downloads with correct filename
7. Scan QR code with mobile device
8. Verify it opens the poll invite URL

**Automated testing**:
```bash
# Run unit tests
pnpm test:unit apps/web/src/components/poll/qr-code-display.test.tsx

# Run integration tests
pnpm test:integration tests/qr-code-sharing.spec.ts
```

## Feature 2: Row-per-Date Layout (P2)

### Step 2.1: Create Helper Function to Group Options

**File**: `apps/web/src/components/poll/group-by-date.ts` (new file)

```tsx
import dayjs from "dayjs";

export interface DateGroup {
  date: string;              // YYYY-MM-DD
  displayDate: string;       // e.g., "Tuesday, December 2"
  options: TimeSlotOption[];
}

export interface TimeSlotOption {
  optionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export function groupOptionsByDate(
  options: Array<{ id: string; startTime: Date; duration: number }>,
): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const option of options) {
    const dateKey = dayjs(option.startTime).format("YYYY-MM-DD");

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        displayDate: dayjs(option.startTime).format("dddd, LL"),
        options: [],
      });
    }

    groups.get(dateKey)!.options.push({
      optionId: option.id,
      startTime: option.startTime,
      endTime: new Date(
        option.startTime.getTime() + option.duration * 60000,
      ),
      duration: option.duration,
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
```

### Step 2.2: Create Time Slot Button Component

**File**: `apps/web/src/components/poll/desktop-poll/time-slot-button.tsx` (new file)

```tsx
"use client";
import * as React from "react";
import type { VoteType } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { cn } from "@rallly/ui";
import { useDayjs } from "@/utils/dayjs";

export interface TimeSlotButtonProps {
  option: {
    optionId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
  };
  vote?: VoteType;
  onChange: (type: VoteType) => void;
  editable: boolean;
}

const voteColors = {
  yes: "bg-green-100 border-green-500 text-green-900",
  ifNeedBe: "bg-yellow-100 border-yellow-500 text-yellow-900",
  no: "bg-gray-100 border-gray-300 text-gray-600",
};

export function TimeSlotButton({
  option,
  vote,
  onChange,
  editable,
}: TimeSlotButtonProps) {
  const { dayjs } = useDayjs();
  const startTime = dayjs(option.startTime).format("LT");
  const endTime = dayjs(option.endTime).format("LT");

  const cycleVote = () => {
    if (!editable) return;
    
    const nextVote: VoteType = 
      vote === "yes" ? "ifNeedBe" : 
      vote === "ifNeedBe" ? "no" : 
      "yes";
    
    onChange(nextVote);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleVote}
      disabled={!editable}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2",
        vote && voteColors[vote],
      )}
    >
      <span className="text-xs font-medium">{startTime}</span>
      <span className="text-xs opacity-75">{endTime}</span>
    </Button>
  );
}
```

### Step 2.3: Create Date Row Component

**File**: `apps/web/src/components/poll/desktop-poll/date-row.tsx` (new file)

```tsx
"use client";
import * as React from "react";
import type { VoteType } from "@rallly/database";
import { Checkbox } from "@rallly/ui/checkbox";
import { cn } from "@rallly/ui";
import { Trans } from "@/components/trans";
import { TimeSlotButton } from "./time-slot-button";
import type { DateGroup } from "../group-by-date";

export interface DateRowProps {
  dateGroup: DateGroup;
  participant: {
    id: string;
    name: string;
  };
  votes: Map<string, VoteType>;
  onVoteChange: (optionId: string, type: VoteType) => void;
  editable: boolean;
  className?: string;
}

export function DateRow({
  dateGroup,
  votes,
  onVoteChange,
  editable,
  className,
}: DateRowProps) {
  const allSlotsNo = React.useMemo(
    () => dateGroup.options.every((opt) => votes.get(opt.optionId) === "no"),
    [dateGroup.options, votes],
  );

  const [noneChecked, setNoneChecked] = React.useState(allSlotsNo);

  React.useEffect(() => {
    setNoneChecked(allSlotsNo);
  }, [allSlotsNo]);

  const handleNoneChange = (checked: boolean) => {
    if (checked) {
      dateGroup.options.forEach((opt) => {
        onVoteChange(opt.optionId, "no");
      });
    }
  };

  const handleSlotChange = (optionId: string, type: VoteType) => {
    if (type !== "no") {
      setNoneChecked(false);
    }
    onVoteChange(optionId, type);
  };

  return (
    <div className={cn("flex items-start gap-4 border-b py-3", className)}>
      <div className="flex w-48 shrink-0 items-center gap-3">
        <Checkbox
          id={`none-${dateGroup.date}`}
          checked={noneChecked}
          onCheckedChange={handleNoneChange}
          disabled={!editable}
        />
        <label
          htmlFor={`none-${dateGroup.date}`}
          className="flex cursor-pointer flex-col text-sm"
        >
          <span className="font-medium">{dateGroup.displayDate}</span>
          <span className="text-muted-foreground text-xs">
            <Trans i18nKey="noneOption" defaults="None" />
          </span>
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {dateGroup.options.map((option) => (
          <TimeSlotButton
            key={option.optionId}
            option={option}
            vote={votes.get(option.optionId)}
            onChange={(type) => handleSlotChange(option.optionId, type)}
            editable={editable}
          />
        ))}
      </div>
    </div>
  );
}
```

### Step 2.4: Modify Desktop Poll Layout

**File**: `apps/web/src/components/poll/desktop-poll.tsx` (modify existing)

Add conditional rendering logic:

```tsx
// Add imports
import { groupOptionsByDate } from "./group-by-date";
import { DateRow } from "./desktop-poll/date-row";

const DesktopPoll: React.FunctionComponent = () => {
  const poll = usePoll();
  const votingForm = useVotingForm();
  
  // Determine if we should use row layout
  const hasDatesAndTimes = poll.options.some(opt => opt.duration > 0);
  const dateGroups = React.useMemo(
    () => hasDatesAndTimes ? groupOptionsByDate(poll.options) : [],
    [poll.options, hasDatesAndTimes]
  );

  // ... existing state and handlers ...

  return (
    <Card>
      <CardHeader>
        {/* ... existing header ... */}
      </CardHeader>

      {hasDatesAndTimes ? (
        // NEW: Row-per-date layout
        <div className="p-4">
          {dateGroups.map((dateGroup) => (
            <DateRow
              key={dateGroup.date}
              dateGroup={dateGroup}
              participant={currentParticipant}
              votes={voteMap}
              onVoteChange={handleVoteChange}
              editable={mode === "edit" || mode === "new"}
            />
          ))}
        </div>
      ) : (
        // EXISTING: Traditional horizontal scroll table
        <div className="relative flex min-h-0 flex-col">
          {/* ... existing table layout ... */}
        </div>
      )}
    </Card>
  );
};
```

### Step 2.5: Add Mobile Support

**File**: `apps/web/src/components/poll/mobile-poll/poll-options.tsx` (modify)

Similar pattern - add conditional rendering for row layout on mobile.

### Step 2.6: Add Translations

```bash
pnpm i18n:scan
```

New keys added:
- `noneOption`
- `noneOptionDescription`
- `voteYes`
- `voteNo`
- `voteIfNeedBe`

### Step 2.7: Test Row Layout Feature

**Manual testing**:
1. Create poll with dates AND times
2. Verify row-per-date layout renders
3. Check "None" for a date
4. Verify all time slots for that date show "No"
5. Click a time slot to select "Yes"
6. Verify "None" checkbox unchecks
7. Individually set all slots to "No"
8. Verify "None" auto-checks

**Automated testing**:
```bash
pnpm test:unit apps/web/src/components/poll/desktop-poll/date-row.test.tsx
pnpm test:integration tests/date-row-layout.spec.ts
```

## Development Workflow

### 1. Pre-commit Checklist

```bash
# Run linter
pnpm check:fix

# Run type checker
pnpm type-check

# Run unit tests
pnpm test:unit

# Extract i18n keys
pnpm i18n:scan
```

### 2. Code Review Checklist

- [ ] All components use `"use client"` directive where needed
- [ ] All text uses `<Trans>` component with i18nKey
- [ ] kebab-case file names
- [ ] Double quotes for strings
- [ ] TailwindCSS classes composed with `cn()`
- [ ] Icons wrapped in `<Icon>` component
- [ ] TypeScript types properly defined
- [ ] No database schema changes
- [ ] Backward compatible with existing polls
- [ ] Tests pass

### 3. Testing Strategy

**Unit Tests** (Vitest):
- QR code generation and download
- Date grouping logic
- None checkbox sync logic
- Vote state transformations

**Integration Tests** (Playwright):
- QR code download end-to-end
- Row layout rendering
- None checkbox interaction
- Vote persistence

### 4. Deployment

```bash
# Build for production
pnpm build

# Run integration tests against build
pnpm test:integration

# Deploy (follows existing Rallly deployment process)
```

## Troubleshooting

### QR Code Issues

**Problem**: QR code doesn't download
- Check canvas ref is populated before download
- Verify `toBlob` is supported in browser
- Check console for errors

**Problem**: QR code quality is poor
- Verify size is 512x512px
- Check error correction level is "M"
- Ensure URL is not too long (< 2000 chars)

### Row Layout Issues

**Problem**: None checkbox doesn't sync
- Check `allSlotsNo` computation in useMemo
- Verify useEffect dependency array includes `allSlotsNo`
- Check vote state is properly updated

**Problem**: Layout doesn't apply to poll
- Verify poll has both dates AND times (duration > 0)
- Check `hasDatesAndTimes` calculation
- Ensure options are properly grouped by date

## Next Steps

After implementing both features:

1. Run full test suite: `pnpm test:unit && pnpm test:integration`
2. Manual QA testing on desktop and mobile
3. i18n verification: Check all text is translatable
4. Performance testing: Large polls (50+ options)
5. Browser compatibility: Chrome, Firefox, Safari, Edge
6. Create PR following Rallly contribution guidelines

## Resources

- [qrcode.react Documentation](https://context7.com/zpao/qrcode.react/llms.txt)
- [Rallly Contributing Guide](../../../CONTRIBUTING.md)
- [Rallly Development Guide](../../../CLAUDE.md)
- [Feature Specification](./spec.md)
- [Component Contracts](./contracts/)

