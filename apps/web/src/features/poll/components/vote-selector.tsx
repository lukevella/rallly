import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";

import { useTranslation } from "@/i18n/client";

import VoteIcon from "./vote-icon";

export interface VoteSelectorProps {
  value?: VoteType;
  /**
   * Accessible description of the option being voted on (e.g. "Tue 30 Jun,
   * 1 PM – 2 PM") so screen readers can tie the vote to its date/time.
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
 * A tri-state vote control: a single button that cycles yes → if need be → no.
 * The value change under a stationary focus is not re-announced by screen
 * readers from the button's own label, so the voting form announces it through
 * a shared live region (see `useVotingForm`). The button's accessible name
 * still leads with the current value so it reads correctly on Tab.
 */
export const VoteSelector = ({
  value,
  optionLabel,
  onChange,
  className,
}: VoteSelectorProps) => {
  const { t } = useTranslation();

  const voteLabel = (() => {
    switch (value) {
      case "yes":
        return t("yes", { defaultValue: "Yes" });
      case "ifNeedBe":
        return t("ifNeedBe", { defaultValue: "If need be" });
      case "no":
        return t("no", { defaultValue: "No" });
      default:
        return t("pending", { defaultValue: "Pending" });
    }
  })();

  return (
    <button
      data-testid="vote-selector"
      type="button"
      aria-label={optionLabel ? `${voteLabel}, ${optionLabel}` : voteLabel}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-lg border border-input bg-background ring-ring focus-visible:ring-2",
        className,
      )}
      onClick={() => {
        onChange?.(toggleVote(value));
      }}
    >
      <VoteIcon type={value} />
    </button>
  );
};
