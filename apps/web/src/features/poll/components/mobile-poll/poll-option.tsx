"use client";
import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import * as m from "motion/react-m";
import type * as React from "react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  filterParticipantsByVote,
  useParticipants,
} from "@/features/poll/components/participants-provider";
import { IfScoresVisible } from "@/features/poll/components/visibility";
import { Trans, useTranslation } from "@/i18n/client";
import { ConnectedScoreSummary } from "../score-summary";
import VoteIcon from "../vote-icon";
import { VoteSegmentedControl } from "../vote-segmented-control";

export interface PollOptionProps {
  children?: React.ReactNode;
  yesScore: number;
  ifNeedBeScore: number;
  editable?: boolean;
  vote?: VoteType;
  onChange: (vote: VoteType) => void;
  selectedParticipantId?: string;
  optionId: string;
  optionLabel: string;
}

const PollOptionVoteSummary: React.FunctionComponent<{ optionId: string }> = ({
  optionId,
}) => {
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const participantsWithVotes = (["yes", "ifNeedBe", "no"] as const).flatMap(
    (voteType) =>
      filterParticipantsByVote(participants, optionId, voteType).map(
        (participant) => ({ participant, voteType }),
      ),
  );

  if (participantsWithVotes.length === 0) {
    return (
      <p className="rounded-lg bg-muted p-2 text-center text-muted-foreground text-sm">
        {t("noVotes", {
          defaultValue: "No one has voted for this option",
        })}
      </p>
    );
  }

  return (
    <ul className="max-h-[min(20rem,40dvh)] space-y-2.5 overflow-y-auto">
      {participantsWithVotes.map(({ participant, voteType }) => (
        <li key={participant.id} className="flex items-center gap-x-2.5">
          <OptimizedAvatarImage
            size="sm"
            name={participant.name}
            src={participant.image ?? undefined}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1 truncate text-sm">
            {participant.name}
          </div>
          <VoteIcon type={voteType} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
};

const PollOption: React.FunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  editable = false,
  optionId,
  optionLabel,
  yesScore,
  ifNeedBeScore,
}) => {
  const { t } = useTranslation();
  const dialog = useDialog();

  const showVote = !editable && !!selectedParticipantId;

  return (
    <div
      className={cn(
        "grid h-14 items-center px-2 text-left transition-[grid-template-columns] duration-300",
        editable && "grid-cols-[0rem_1fr_3.5rem_8.875rem]",
        showVote && "grid-cols-[1.875rem_1fr_3.5rem_0rem]",
        !editable && !showVote && "grid-cols-[0rem_1fr_3.5rem_0rem]",
      )}
      data-testid="poll-option"
    >
      <span
        aria-hidden={showVote ? undefined : true}
        className="overflow-hidden"
      >
        {showVote ? <VoteIcon type={vote} /> : null}
      </span>
      {children}
      <IfScoresVisible>
        <Button
          {...dialog.triggerProps}
          aria-label={`${t("optionVoteBreakdown", {
            defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
            yesScore,
            ifNeedBeScore,
          })}. ${t("showParticipantVotes", {
            defaultValue: "Show participant votes",
          })}`}
          variant="ghost"
          size="lg"
          className="col-start-3 justify-self-end"
        >
          <ConnectedScoreSummary optionId={optionId} />
        </Button>
        <Dialog {...dialog.dialogProps}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="participants" defaults="Participants" />
              </DialogTitle>
              <DialogDescription>{optionLabel}</DialogDescription>
            </DialogHeader>
            <PollOptionVoteSummary optionId={optionId} />
          </DialogContent>
        </Dialog>
      </IfScoresVisible>
      {editable ? (
        <m.div
          className="col-start-4 justify-self-end"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <VoteSegmentedControl
            value={vote}
            onChange={onChange}
            optionLabel={optionLabel}
          />
        </m.div>
      ) : null}
    </div>
  );
};

export default PollOption;
