"use client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import * as React from "react";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { IfScoresVisible } from "@/features/poll/components/visibility";
import { VoteBreakdownDialog } from "@/features/poll/components/vote-breakdown-dialog";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import { useVotingForm } from "@/features/poll/components/voting-form";
import type { VoteType } from "@/features/poll/constants";
import { Trans, useTranslation } from "@/i18n/client";
import type { ParsedDateTimeOpton } from "@/lib/utils/date-time-utils";
import { getOptionDateTimeLabel } from "@/lib/utils/date-time-utils";

function VoteBreakdownButton({
  optionId,
  optionLabel,
}: {
  optionId: string;
  optionLabel: string;
}) {
  const { t } = useTranslation();
  const { getScore, poll } = usePoll();
  const { yes, ifNeedBe } = getScore(optionId);
  const dialog = useDialog();

  return (
    <IfScoresVisible>
      <Button {...dialog.triggerProps} variant="ghost" size="sm">
        {poll.allowTentativeVotes
          ? t("optionVoteBreakdown", {
              defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
              yesScore: yes,
              ifNeedBeScore: ifNeedBe,
            })
          : t("optionVoteBreakdownYesOnly", {
              defaultValue: "{yesScore} yes",
              yesScore: yes,
            })}
        <span className="sr-only">
          {". "}
          <Trans
            i18nKey="showParticipantVotes"
            defaults="Show participant votes"
          />
        </span>
      </Button>
      <VoteBreakdownDialog
        {...dialog.dialogProps}
        optionId={optionId}
        optionLabel={optionLabel}
      />
    </IfScoresVisible>
  );
}

function VoteLabel({ type }: { type?: VoteType }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <VoteIcon type={type} />
      {type === "yes" ? (
        <Trans i18nKey="yes" defaults="Yes" />
      ) : type === "ifNeedBe" ? (
        <Trans i18nKey="ifNeedBe" defaults="If need be" />
      ) : type === "no" ? (
        <Trans i18nKey="no" defaults="No" />
      ) : (
        <Trans i18nKey="pending" defaults="Pending" />
      )}
    </span>
  );
}

function VotingOptionRow({
  option,
  editable,
  vote,
  onChange,
}: {
  option: ParsedDateTimeOpton;
  editable: boolean;
  vote?: VoteType;
  onChange: (vote: VoteType) => void;
}) {
  const { poll } = usePoll();
  const optionLabel = getOptionDateTimeLabel(option);

  return (
    // Below sm the breakdown button drops under the label and the vote
    // control spans both lines. Scroll margins keep a keyboard-focused row
    // clear of the sticky bars.
    <li
      data-testid="poll-option"
      className="grid scroll-mt-16 scroll-mb-20 grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-2 sm:grid-cols-[1fr_auto_auto]"
    >
      <span className="whitespace-nowrap text-sm">
        {option.type === "timeSlot"
          ? `${option.startTime} – ${option.endTime}`
          : `${option.dow} ${option.day}`}
      </span>
      <div className="col-start-1 row-start-2 justify-self-start sm:col-start-auto sm:row-start-auto sm:justify-self-auto">
        <VoteBreakdownButton
          optionId={option.optionId}
          optionLabel={optionLabel}
        />
      </div>
      <div className="col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
        {editable ? (
          <VoteSegmentedControl
            value={vote}
            onChange={onChange}
            optionLabel={optionLabel}
            allowTentativeVotes={poll.allowTentativeVotes}
          />
        ) : vote !== undefined ? (
          <VoteLabel type={vote} />
        ) : null}
      </div>
    </li>
  );
}

export function VotingOptions() {
  const { options, pollType } = useOptions();
  const { getVote, optionIds } = usePoll();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const votes = votingForm.watch("votes");
  const participantId = votingForm.watch("participantId");
  const editable = mode !== "view";
  const headingId = React.useId();

  const groups = new Map<string, ParsedDateTimeOpton[]>();
  for (const option of options as ParsedDateTimeOpton[]) {
    const heading =
      pollType === "timeSlot"
        ? `${option.dow} ${option.day} ${option.month} ${option.year}`
        : `${option.month} ${option.year}`;
    groups.set(heading, [...(groups.get(heading) ?? []), option]);
  }

  return (
    <div className="flex-1">
      {Array.from(groups, ([heading, groupOptions], groupIndex) => {
        const id = `${headingId}-${groupIndex}`;
        return (
          <section key={heading} aria-labelledby={id}>
            <h3
              id={id}
              className="border-b bg-muted/50 px-4 py-2 font-medium text-sm"
            >
              {heading}
            </h3>
            <ul className="divide-y">
              {groupOptions.map((option) => {
                const index = optionIds.indexOf(option.optionId);
                const vote = editable
                  ? votes[index]?.type
                  : participantId
                    ? getVote(participantId, option.optionId)
                    : undefined;
                return (
                  <VotingOptionRow
                    key={option.optionId}
                    option={option}
                    editable={editable}
                    vote={vote}
                    onChange={(newVote) => {
                      const next = [...votes];
                      next[index] = {
                        optionId: option.optionId,
                        type: newVote,
                      };
                      votingForm.setValue("votes", next, { shouldDirty: true });
                    }}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
