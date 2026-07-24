import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import * as React from "react";

import { useTranslation } from "@/i18n/client";

import VoteIcon from "./vote-icon";

export interface VoteSelectorProps {
  value?: VoteType;
  /**
   * Accessible name for the group (e.g. "Tue 30 Jun, 1 PM – 2 PM") so screen
   * readers can tie the vote to its date/time.
   */
  optionLabel?: string;
  onChange?: (value: VoteType) => void;
  className?: string;
}

const orderedVoteTypes: VoteType[] = ["yes", "ifNeedBe", "no"];

export const toggleVote = (value?: VoteType) => {
  if (!value) return orderedVoteTypes[0];
  return orderedVoteTypes[
    (orderedVoteTypes.indexOf(value) + 1) % orderedVoteTypes.length
  ];
};

/**
 * A tri-state vote control. Visually a single square that cycles yes → if need
 * be → no on click, but implemented as an ARIA radio group so screen readers
 * announce the selected value natively (a changed aria-label on the focused
 * element is not re-announced; a radio selection change is). Only the checked
 * radio is visible; arrow keys move selection, which moves both visibility and
 * focus, so the control always looks like one square.
 */
export const VoteSelector = ({
  value,
  optionLabel,
  onChange,
  className,
}: VoteSelectorProps) => {
  const { t } = useTranslation();

  const voteLabels: Record<VoteType, string> = {
    yes: t("yes", { defaultValue: "Yes" }),
    ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
    no: t("no", { defaultValue: "No" }),
  };

  // With no vote yet, the first radio is the keyboard entry point.
  const focusedType = value ?? orderedVoteTypes[0];

  const groupRef = React.useRef<HTMLDivElement>(null);
  const visibleRef = React.useRef<HTMLButtonElement>(null);

  // Selection moves visibility to a different radio, so keep DOM focus on the
  // visible one — but only when focus is already inside the group, so a mouse
  // click or a programmatic change never steals focus. `value` is the trigger:
  // the effect re-runs on selection change and re-homes focus to the new radio.
  // biome-ignore lint/correctness/useExhaustiveDependencies: value is the trigger, not a read
  React.useEffect(() => {
    const group = groupRef.current;
    if (group?.contains(document.activeElement)) {
      visibleRef.current?.focus();
    }
  }, [value]);

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={optionLabel}
      className="flex items-center justify-center"
    >
      {orderedVoteTypes.map((type) => {
        const checked = value === type;
        // The checked radio (or the first, before any vote) is the visible,
        // clickable square; the others exist only for the a11y tree.
        const visible = value ? checked : type === focusedType;
        return (
          // biome-ignore lint/a11y/useSemanticElements: a native radio input can't be styled to this stacked single-square control; role="radio" buttons are the ARIA APG custom radio group pattern
          <button
            key={type}
            ref={visible ? visibleRef : undefined}
            data-testid={visible ? "vote-selector" : undefined}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={voteLabels[type]}
            tabIndex={type === focusedType ? 0 : -1}
            className={cn(
              visible
                ? cn(
                    "flex size-7 cursor-pointer items-center justify-center rounded-lg border border-input bg-background ring-ring focus-visible:ring-2",
                    className,
                  )
                : "sr-only",
            )}
            onClick={() => {
              // Click cycles rather than selecting this specific value, matching
              // the original toggle: the only visible target is the current one.
              onChange?.(toggleVote(value));
            }}
            onKeyDown={(event) => {
              const delta =
                event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? -1
                    : 0;
              if (delta === 0) return;
              event.preventDefault();
              const current = orderedVoteTypes.indexOf(focusedType);
              const next =
                orderedVoteTypes[
                  (current + delta + orderedVoteTypes.length) %
                    orderedVoteTypes.length
                ];
              onChange?.(next);
            }}
          >
            {visible ? <VoteIcon type={value} /> : voteLabels[type]}
          </button>
        );
      })}
    </div>
  );
};
