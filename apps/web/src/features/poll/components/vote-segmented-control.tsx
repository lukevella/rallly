"use client";
import { cn } from "@rallly/ui";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";

import { getVoteTypes } from "@/features/poll/constants";
import { useTranslation } from "@/i18n/client";

import VoteIcon from "./vote-icon";

type VoteType = "yes" | "ifNeedBe" | "no";

export const VoteSegmentedControl = ({
  value,
  onChange,
  optionLabel,
  allowTentativeVotes = true,
  disabled,
  className,
}: {
  value?: VoteType;
  onChange: (value: VoteType) => void;
  className?: string;
  /** When false only yes and no are offered. */
  allowTentativeVotes?: boolean;
  /** Locks the vote, e.g. on an option that has already passed. */
  disabled?: boolean;
  /**
   * Accessible description of the option being voted on (e.g. "Tue 30 Jun
   * 2026, 1:00 PM – 2:00 PM") so screen readers can tie the vote to its
   * date/time.
   */
  optionLabel?: string;
}) => {
  const { t } = useTranslation();
  const voteTypes = getVoteTypes(allowTentativeVotes);

  const voteLabels: Record<VoteType, string> = {
    yes: t("yes", { defaultValue: "Yes" }),
    ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
    no: t("no", { defaultValue: "No" }),
  };

  return (
    <SegmentedControl
      data-testid="vote-selector"
      aria-label={optionLabel}
      // Touch-sized below sm; from there it matches a default button.
      className={cn("h-11 data-disabled:opacity-50 sm:h-9", className)}
      disabled={disabled}
      value={value ?? null}
      onValueChange={(newValue) => {
        if (newValue) {
          onChange(newValue as VoteType);
        }
      }}
    >
      {voteTypes.map((type) => (
        <SegmentedControlItem
          key={type}
          value={type}
          aria-label={voteLabels[type]}
          className="w-11 data-disabled:cursor-not-allowed sm:w-9 data-unchecked:[&_svg]:text-gray-400 dark:data-unchecked:[&_svg]:text-gray-600"
        >
          <VoteIcon type={type} />
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
};
