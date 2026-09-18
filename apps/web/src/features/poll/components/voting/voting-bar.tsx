"use client";
import { Button } from "@rallly/ui/button";
import { usePermissions, usePoll } from "@/features/poll/client";
import VoteIcon from "@/features/poll/components/vote-icon";
import {
  DeclineButton,
  SubmitResponseButton,
  useSelectionCount,
} from "@/features/poll/components/voting-footer";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t px-4 py-3">
      {children}
    </footer>
  );
}

/**
 * Vote icons with counts. The icons are decorative; the live region reads
 * the same counts as a sentence.
 */
function SelectionCount({
  yesCount,
  ifNeedBeCount,
}: {
  yesCount: number;
  ifNeedBeCount: number;
}) {
  const poll = usePoll();
  const { t } = useTranslation();
  return (
    <p aria-live="polite" className="flex items-center gap-4 text-sm">
      <span className="sr-only">
        {poll.allowTentativeVotes
          ? t("optionVoteBreakdown", {
              defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
              yesScore: yesCount,
              ifNeedBeScore: ifNeedBeCount,
            })
          : t("optionVoteBreakdownYesOnly", {
              defaultValue: "{yesScore} yes",
              yesScore: yesCount,
            })}
      </span>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <VoteIcon type="yes" />
        <span className="tabular-nums">{yesCount}</span>
      </span>
      {poll.allowTentativeVotes ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <VoteIcon type="ifNeedBe" />
          <span className="tabular-nums">{ifNeedBeCount}</span>
        </span>
      ) : null}
    </p>
  );
}

/**
 * Footer of the voting interface. While a response is being composed it
 * shows the live selection count with Decline and Continue (or Cancel and
 * Save for an existing response).
 */
export function VotingBar() {
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const participantId = votingForm.watch("participantId");
  const { yesCount, ifNeedBeCount } = useSelectionCount();
  const { canAddNewParticipant } = usePermissions();

  if (mode === "view") {
    // A saved response is summarized in the header; the footer only offers
    // a new response when the viewer has none.
    if (participantId || !canAddNewParticipant) {
      return null;
    }
    return (
      <Bar>
        <span />
        <Button
          variant="primary"
          onClick={() => {
            votingForm.newParticipant();
          }}
        >
          <Trans i18nKey="newResponse" defaults="New response" />
        </Button>
      </Bar>
    );
  }

  return (
    <Bar>
      <SelectionCount yesCount={yesCount} ifNeedBeCount={ifNeedBeCount} />
      <div className="flex items-center gap-2">
        {mode === "edit" ? (
          <Button
            size="lg"
            onClick={() => {
              votingForm.setValue("mode", "view");
            }}
          >
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
        ) : (
          <DeclineButton />
        )}
        <SubmitResponseButton />
      </div>
    </Bar>
  );
}
