# Component Contract: DateRow

**File**: `apps/web/src/components/poll/desktop-poll/date-row.tsx`  
**Type**: Client Component ("use client")

## Purpose

Renders a single date row in the row-per-date poll layout, displaying a "None" checkbox and all time slot buttons for that date with bidirectional state synchronization.

## Props Interface

```tsx
export interface DateRowProps {
  /**
   * Date key in YYYY-MM-DD format
   * @example "2025-12-02"
   */
  date: string;

  /**
   * Display formatted date for header
   * @example "Tuesday, December 2, 2025"
   */
  displayDate: string;

  /**
   * Time slot options for this date
   */
  options: TimeSlotOption[];

  /**
   * Current participant
   */
  participant: {
    id: string;
    name: string;
  };

  /**
   * Current vote state (optionId → VoteType)
   */
  votes: Map<string, VoteType>;

  /**
   * Callback when vote changes
   */
  onVoteChange: (optionId: string, type: VoteType) => void;

  /**
   * Whether this row is editable
   */
  editable: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface TimeSlotOption {
  optionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}
```

## Component Structure

```tsx
export function DateRow({
  date,
  displayDate,
  options,
  participant,
  votes,
  onVoteChange,
  editable,
  className,
}: DateRowProps) {
  // Compute whether all slots are "no"
  const allSlotsNo = React.useMemo(
    () => options.every(opt => votes.get(opt.optionId) === 'no'),
    [options, votes]
  );

  // Checkbox state syncs with vote state
  const [noneChecked, setNoneChecked] = React.useState(allSlotsNo);

  React.useEffect(() => {
    setNoneChecked(allSlotsNo);
  }, [allSlotsNo]);

  // Handlers
  // Rendering
}
```

## Rendering Output

```tsx
<div className={cn("flex items-start gap-4 border-b py-3", className)}>
  {/* Date Header with None Checkbox */}
  <div className="flex w-48 shrink-0 items-center gap-3">
    <Checkbox
      id={`none-${date}`}
      checked={noneChecked}
      onCheckedChange={handleNoneChange}
      disabled={!editable}
    />
    <label
      htmlFor={`none-${date}`}
      className="flex flex-col text-sm cursor-pointer"
    >
      <span className="font-medium">{displayDate}</span>
      <span className="text-muted-foreground text-xs">
        <Trans i18nKey="noneOption" defaults="None" />
      </span>
    </label>
  </div>

  {/* Time Slot Buttons */}
  <div className="flex gap-2 overflow-x-auto">
    {options.map((option) => (
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
```

## Behavior

### None Checkbox Logic

**Initial state**:
```tsx
// Checkbox reflects whether all slots are "no"
const allSlotsNo = options.every(opt => votes.get(opt.optionId) === 'no');
setNoneChecked(allSlotsNo);
```

**User checks "None"**:
```tsx
const handleNoneChange = (checked: boolean) => {
  if (checked) {
    // Set all slots to "no", overriding existing votes
    options.forEach(opt => {
      onVoteChange(opt.optionId, 'no');
    });
  }
  // Note: Unchecking "None" does nothing - user must select individual slots
};
```

**User selects time slot to "Yes" or "If need be"**:
```tsx
const handleSlotChange = (optionId: string, type: VoteType) => {
  if (type !== 'no') {
    // Uncheck "None" checkbox immediately
    setNoneChecked(false);
  }
  onVoteChange(optionId, type);
};
```

**User sets all slots to "No" individually**:
```tsx
// useEffect automatically checks "None" when allSlotsNo becomes true
React.useEffect(() => {
  setNoneChecked(allSlotsNo);
}, [allSlotsNo]);
```

### Bidirectional Sync Flow

```
[None Checkbox] ←→ [Vote State] ←→ [Time Slot Buttons]

Checkbox checked → All slots set to "no"
Any slot set to "yes"/"ifNeedBe" → Checkbox unchecked
All slots set to "no" individually → Checkbox auto-checks
```

## Dependencies

```tsx
import * as React from "react";
import type { VoteType } from "@rallly/database";
import { Checkbox } from "@rallly/ui/checkbox";
import { cn } from "@rallly/ui";
import { Trans } from "@/components/trans";
import { TimeSlotButton } from "./time-slot-button";
import { useDayjs } from "@/utils/dayjs";
```

## Usage Example

```tsx
import { DateRow } from "@/components/poll/desktop-poll/date-row";

function DateRowLayout() {
  const poll = usePoll();
  const participant = useCurrentParticipant();
  const dateGroups = groupOptionsByDate(poll.options);
  const voteMap = new Map(participant.votes.map(v => [v.optionId, v.type]));

  return (
    <div className="space-y-0">
      {dateGroups.map((group) => (
        <DateRow
          key={group.date}
          date={group.date}
          displayDate={group.displayDate}
          options={group.options}
          participant={participant}
          votes={voteMap}
          onVoteChange={handleVoteChange}
          editable={isEditing}
        />
      ))}
    </div>
  );
}
```

## Accessibility

- **Checkbox**: 
  - id and label for association
  - aria-label: "Decline all times for {displayDate}"
  - Keyboard accessible
  
- **Time slot buttons**: 
  - Each button is keyboard accessible
  - aria-label describes time and current selection

- **Overflow scroll**:
  - Keyboard scroll support (arrow keys, tab navigation)
  - Visual indicators for overflow

## i18n Keys

```json
{
  "noneOption": "None",
  "noneOptionDescription": "Not available this day",
  "declineAllTimesForDate": "Decline all times for {date}",
  "timeSlot": "{startTime} - {endTime}",
  "voteYes": "Available",
  "voteNo": "Not available",
  "voteIfNeedBe": "If need be"
}
```

## Testing

### Unit Tests

```tsx
describe('DateRow', () => {
  it('renders date header and time slots', () => {
    const { getByText } = render(
      <DateRow
        date="2025-12-02"
        displayDate="Tuesday, December 2"
        options={mockOptions}
        participant={mockParticipant}
        votes={new Map()}
        onVoteChange={jest.fn()}
        editable={true}
      />
    );
    expect(getByText('Tuesday, December 2')).toBeInTheDocument();
  });

  it('checks None when all slots are no', () => {
    const votes = new Map([
      ['opt1', 'no'],
      ['opt2', 'no'],
    ]);
    const { getByRole } = render(<DateRow {...props} votes={votes} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('unchecks None when any slot is not no', () => {
    const votes = new Map([
      ['opt1', 'yes'],
      ['opt2', 'no'],
    ]);
    const { getByRole } = render(<DateRow {...props} votes={votes} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('sets all slots to no when None is checked', async () => {
    const onVoteChange = jest.fn();
    const { getByRole } = render(
      <DateRow {...props} onVoteChange={onVoteChange} />
    );
    const checkbox = getByRole('checkbox');
    
    await userEvent.click(checkbox);
    
    expect(onVoteChange).toHaveBeenCalledWith('opt1', 'no');
    expect(onVoteChange).toHaveBeenCalledWith('opt2', 'no');
  });

  it('unchecks None when slot is set to yes', async () => {
    const { getByText } = render(<DateRow {...props} />);
    const slotButton = getByText('12:00 - 1:00');
    
    await userEvent.click(slotButton);  // Select "yes"
    
    const checkbox = getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });
});
```

### Integration Tests

```tsx
test('participant can decline entire day with None checkbox', async ({ page }) => {
  // Navigate to poll with date+time options
  // Click "None" checkbox for Tuesday
  // Verify all Tuesday time slots show "No"
  // Verify checkbox is checked
});

test('None checkbox auto-checks when all slots declined individually', async ({ page }) => {
  // Navigate to poll
  // Click "No" on each time slot for Tuesday
  // Verify "None" checkbox becomes checked
});

test('selecting Yes unchecks None checkbox', async ({ page }) => {
  // Navigate to poll
  // Check "None" for Tuesday
  // Click "Yes" on one Tuesday time slot
  // Verify "None" checkbox is unchecked
  // Verify that time slot shows "Yes"
});
```

## Performance

- **Memoization**: `allSlotsNo` computed with useMemo to avoid recalculation on every render
- **Checkbox sync**: useEffect runs only when `allSlotsNo` changes
- **Vote updates**: Batched by React for efficient rendering

## Responsive Design

**Desktop** (>= 768px):
- Fixed width date header (192px / w-48)
- Horizontal scroll for time slots
- Multiple rows visible simultaneously

**Mobile** (< 768px):
- Full width date header
- Horizontal scroll for time slots
- One date visible at a time (vertical stack)

```tsx
<div className="md:w-48 w-full">
  {/* Date header */}
</div>
<div className="overflow-x-auto flex gap-2 md:gap-3">
  {/* Time slots */}
</div>
```

## Edge Cases

- **Empty options array**: Render date header only, no time slots
- **Single time slot**: Show checkbox even though it's redundant (consistency)
- **Many time slots (20+)**: Horizontal scroll works smoothly
- **Rapid clicking**: State updates are batched, no flickering
- **Vote data missing**: Default to no vote (empty button state)

## Future Enhancements

- [ ] Select all "Yes" or "If need be" shortcuts
- [ ] Keyboard shortcuts for quick voting (1=Yes, 2=IfNeedBe, 3=No)
- [ ] Visual indication of most popular time on each date
- [ ] Collapse/expand date rows

