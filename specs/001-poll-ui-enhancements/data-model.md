# Data Model: Poll UI Enhancements

**Date**: 2025-12-01  
**Phase**: 1 - Design

## Overview

This feature requires **NO database schema changes**. All data structures are UI state and component props that work with existing Prisma models (Poll, Option, Vote, Participant).

## Existing Database Schema (No Changes)

### Relevant Models

```prisma
// packages/database/prisma/models/poll.prisma

enum VoteType {
  yes
  no
  ifNeedBe
}

model Option {
  id        String   @id @default(cuid())
  startTime DateTime @map("start_time") @db.Timestamp(0)
  duration  Int      @default(0) @map("duration_minutes")
  pollId    String   @map("poll_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  votes Vote[]
  poll  Poll @relation(fields: [pollId], references: [id], onDelete: Cascade)
}

model Vote {
  id            String    @id @default(cuid())
  participantId String    @map("participant_id")
  optionId      String    @map("option_id")
  pollId        String    @map("poll_id")
  type          VoteType  @default(yes)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime? @updatedAt @map("updated_at")
}
```

**Key observations**:
- VoteType enum already has `yes`, `no`, `ifNeedBe` (matching "Yes"/"No"/"If need be" states)
- Option.duration distinguishes date-only (duration=0) from date+time polls (duration>0)
- No changes needed to support row-per-date layout or QR codes

## UI State Models

### 1. QR Code Component State

```tsx
interface QRCodeDisplayProps {
  /**
   * The poll invite URL to encode in the QR code
   */
  url: string;
  
  /**
   * Poll ID for filename generation when downloading
   */
  pollId: string;
  
  /**
   * Size in pixels (512x512 per spec)
   */
  size?: number;
  
  /**
   * Error correction level (M = Medium per spec)
   */
  level?: 'L' | 'M' | 'Q' | 'H';
}

interface QRCodeDisplayState {
  /**
   * Reference to canvas element for PNG download
   */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  /**
   * Whether download is in progress
   */
  isDownloading: boolean;
  
  /**
   * Error state if QR generation fails
   */
  error: string | null;
}
```

**Lifecycle**:
1. Component mounts → QRCodeCanvas renders → canvas ref populated
2. User clicks "Download" → `canvasRef.current.toBlob()` → PNG download triggers
3. Error handling → display error message, allow retry

**Data flow**:
```
Poll context → pollId + invite URL
       ↓
QRCodeDisplay props
       ↓
QRCodeCanvas (qrcode.react)
       ↓
Canvas ref → toBlob() → PNG download
```

### 2. Date Row Layout State

```tsx
interface DateGroup {
  /**
   * Date key in YYYY-MM-DD format
   */
  date: string;
  
  /**
   * Display formatted date (e.g., "Tuesday, December 2")
   */
  displayDate: string;
  
  /**
   * All time slot options for this date
   */
  options: Array<{
    optionId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
  }>;
}

interface DateRowProps {
  /**
   * The date group being rendered
   */
  dateGroup: DateGroup;
  
  /**
   * Current participant viewing/editing
   */
  participant: {
    id: string;
    name: string;
  };
  
  /**
   * Current votes for this participant
   */
  votes: Map<string, VoteType>;  // optionId → vote type
  
  /**
   * Callback when vote changes
   */
  onVoteChange: (optionId: string, type: VoteType) => void;
  
  /**
   * Whether this row is editable
   */
  editable: boolean;
}

interface DateRowState {
  /**
   * Whether "None" checkbox is checked
   * Derived from votes, but tracked for UI responsiveness
   */
  noneChecked: boolean;
  
  /**
   * Whether all slots for this date are set to "no"
   * Used to auto-check "None"
   */
  allSlotsNo: boolean;
}
```

**State synchronization logic**:
```tsx
// Derived state
const allSlotsNo = dateGroup.options.every(
  opt => votes.get(opt.optionId) === 'no'
);

// Checkbox state syncs with derived state
React.useEffect(() => {
  setNoneChecked(allSlotsNo);
}, [allSlotsNo]);

// User actions
const handleNoneChange = (checked: boolean) => {
  if (checked) {
    // Set all slots to "no"
    dateGroup.options.forEach(opt => {
      onVoteChange(opt.optionId, 'no');
    });
  }
};

const handleSlotChange = (optionId: string, type: VoteType) => {
  if (type !== 'no') {
    // Uncheck "None" when selecting Yes/IfNeedBe
    setNoneChecked(false);
  }
  onVoteChange(optionId, type);
};
```

### 3. Poll Layout Determination

```tsx
interface PollLayoutConfig {
  /**
   * Whether poll uses row-per-date layout
   * True when poll has BOTH dates and times (duration > 0)
   */
  useRowLayout: boolean;
  
  /**
   * Grouped options by date (only populated if useRowLayout=true)
   */
  dateGroups: DateGroup[];
  
  /**
   * Original flat options list (used for traditional layout)
   */
  options: Option[];
}

// Determination logic
function getPollLayoutConfig(poll: Poll): PollLayoutConfig {
  const hasDatesAndTimes = poll.options.some(opt => opt.duration > 0);
  
  if (!hasDatesAndTimes) {
    return {
      useRowLayout: false,
      dateGroups: [],
      options: poll.options,
    };
  }
  
  // Group by date
  const grouped = poll.options.reduce((acc, option) => {
    const dateKey = dayjs(option.startTime).format('YYYY-MM-DD');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        displayDate: dayjs(option.startTime).format('dddd, LL'),
        options: [],
      };
    }
    acc[dateKey].options.push({
      optionId: option.id,
      startTime: option.startTime,
      endTime: new Date(option.startTime.getTime() + option.duration * 60000),
      duration: option.duration,
    });
    return acc;
  }, {} as Record<string, DateGroup>);
  
  return {
    useRowLayout: true,
    dateGroups: Object.values(grouped),
    options: poll.options,
  };
}
```

## Component Prop Interfaces

### QRCodeDisplay

```tsx
export interface QRCodeDisplayProps {
  /** Poll invite URL */
  url: string;
  /** Poll ID for filename */
  pollId: string;
  /** QR code size in pixels */
  size?: number;
  /** Error correction level */
  level?: 'L' | 'M' | 'Q' | 'H';
}
```

### DateRow

```tsx
export interface DateRowProps {
  /** Date being displayed */
  date: string;
  /** Display formatted date */
  displayDate: string;
  /** Time slot options for this date */
  options: TimeSlotOption[];
  /** Current participant */
  participant: Participant;
  /** Vote state */
  votes: Map<string, VoteType>;
  /** Vote change handler */
  onVoteChange: (optionId: string, type: VoteType) => void;
  /** Whether editable */
  editable: boolean;
}

interface TimeSlotOption {
  optionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}
```

### NoneCheckbox

```tsx
export interface NoneCheckboxProps {
  /** Whether checkbox is checked */
  checked: boolean;
  /** Change handler */
  onCheckedChange: (checked: boolean) => void;
  /** Date this checkbox applies to */
  date: string;
  /** Whether checkbox is disabled */
  disabled?: boolean;
}
```

## Data Transformations

### 1. Poll Options → Date Groups

```tsx
function groupOptionsByDate(options: Option[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();
  
  for (const option of options) {
    const dateKey = dayjs(option.startTime).format('YYYY-MM-DD');
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        displayDate: dayjs(option.startTime).format('dddd, LL'),
        options: [],
      });
    }
    
    groups.get(dateKey)!.options.push({
      optionId: option.id,
      startTime: option.startTime,
      endTime: new Date(option.startTime.getTime() + option.duration * 60000),
      duration: option.duration,
    });
  }
  
  return Array.from(groups.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}
```

### 2. Votes Array → Vote Map

```tsx
function votesToMap(votes: Vote[]): Map<string, VoteType> {
  return new Map(votes.map(v => [v.optionId, v.type]));
}
```

### 3. Canvas → PNG Blob

```tsx
async function canvasToPngBlob(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/png',
      1.0  // Quality (1.0 = maximum)
    );
  });
}
```

## State Flow Diagrams

### QR Code Download Flow

```
User clicks "Download"
       ↓
Get canvas ref
       ↓
canvasRef.current.toBlob()
       ↓
Create object URL from blob
       ↓
Create <a> element with download attribute
       ↓
Trigger click() → browser downloads PNG
       ↓
Cleanup: URL.revokeObjectURL()
```

### None Checkbox Sync Flow

```
Initial render:
  votes → compute allSlotsNo → set noneChecked state

User checks "None":
  setNoneChecked(true) → call onVoteChange for all slots → votes update → allSlotsNo remains true

User selects "Yes" on slot:
  setNoneChecked(false) → call onVoteChange(optionId, 'yes') → votes update → allSlotsNo becomes false

User sets all slots to "No" individually:
  each onVoteChange('no') → votes update → allSlotsNo becomes true → useEffect triggers → setNoneChecked(true)
```

## Validation Rules

### QR Code URL Validation

```tsx
function validateQRCodeUrl(url: string): boolean {
  // QR codes with Medium error correction can handle ~2,000 chars
  if (url.length > 2000) {
    console.warn('URL may be too long for reliable QR scanning');
  }
  
  // Must be valid URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Date Row Vote Validation

```tsx
function validateDateRowVotes(
  dateGroup: DateGroup,
  votes: Map<string, VoteType>
): boolean {
  // All options in the date group should have a vote
  return dateGroup.options.every(opt => votes.has(opt.optionId));
}
```

## Performance Considerations

### Memoization Strategy

```tsx
// Memoize date grouping (expensive for large polls)
const dateGroups = React.useMemo(
  () => groupOptionsByDate(poll.options),
  [poll.options]
);

// Memoize vote map conversion
const voteMap = React.useMemo(
  () => votesToMap(participant.votes),
  [participant.votes]
);

// Memoize allSlotsNo computation per date
const allSlotsNo = React.useMemo(
  () => dateGroup.options.every(opt => voteMap.get(opt.optionId) === 'no'),
  [dateGroup.options, voteMap]
);
```

## Summary

### No Database Changes Required

Both features work entirely with existing schema:
- QR codes: Client-side rendering, no server storage
- Row layout: UI reorganization of existing Option/Vote data

### Key Data Structures

1. **DateGroup**: Groups poll options by date for row layout
2. **QRCodeDisplay State**: Canvas ref and download state
3. **DateRow State**: None checkbox sync with vote state

### Data Flow

```
Prisma (Poll, Option, Vote)
       ↓
tRPC query → Poll context
       ↓
       ├→ QRCodeDisplay (invite URL)
       └→ DateRowLayout (grouped options + votes)
              ↓
       DateRow components (one per date)
              ↓
       NoneCheckbox + TimeSlotButtons
              ↓
       Vote changes → tRPC mutation → Prisma
```

All state is ephemeral UI state - no persistence layer changes needed.

