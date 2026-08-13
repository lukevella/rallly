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
  const participantsWhoVotedYes = filterParticipantsByVote(
    participants,
    optionId,
    "yes",
  );
  const participantsWhoVotedIfNeedBe = filterParticipantsByVote(
    participants,
    optionId,
    "ifNeedBe",
  );
  const participantsWhoVotedNo = filterParticipantsByVote(
    participants,
    optionId,
    "no",
  );
  const noVotes =
    participantsWhoVotedYes.length + participantsWhoVotedIfNeedBe.length === 0;
  return (
    <div>
      {noVotes ? (
        <p className="rounded-lg bg-muted p-2 text-center text-muted-foreground text-sm">
          {t("noVotes", {
            defaultValue: "No one has voted for this option",
          })}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-1 space-y-2.5">
            {participantsWhoVotedYes.map(({ name, image }, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-4 items-center justify-center">
                  <OptimizedAvatarImage
                    size="sm"
                    name={name}
                    src={image ?? undefined}
                  />
                  <VoteIcon
                    type="yes"
                    size="sm"
                    className="absolute bottom-0 left-full -translate-x-1 translate-y-1 rounded-full bg-background"
                  />
                </div>
                <div className="truncate text-sm">{name}</div>
              </div>
            ))}
            {participantsWhoVotedIfNeedBe.map(({ name, image }, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-4 items-center justify-center">
                  <OptimizedAvatarImage
                    size="sm"
                    name={name}
                    src={image ?? undefined}
                  />
                  <VoteIcon
                    type="ifNeedBe"
                    size="sm"
                    className="absolute bottom-0 left-full -translate-x-1 translate-y-1 rounded-full bg-background"
                  />
                </div>
                <div className="truncate text-sm"> {name}</div>
              </div>
            ))}
          </div>
          <div className="col-span-1 space-y-2.5">
            {participantsWhoVotedNo.map(({ name, image }, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-4 items-center justify-center">
                  <OptimizedAvatarImage
                    size="sm"
                    name={name}
                    src={image ?? undefined}
                  />
                  <VoteIcon
                    type="no"
                    size="sm"
                    className="absolute bottom-0 left-full -translate-x-1 translate-y-1 rounded-full bg-background"
                  />
                </div>
                <div className="truncate text-sm">{name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  const optionSummary = (
    <>
      <span
        aria-hidden={showVote ? undefined : true}
        className="overflow-hidden"
      >
        {showVote ? <VoteIcon type={vote} /> : null}
      </span>
      {children}
    </>
  );

  const optionGrid = cn(
    "grid min-w-0 flex-1 items-center px-2 text-left transition-[grid-template-columns] duration-300",
    showVote
      ? "grid-cols-[1.875rem_4.5rem_1fr]"
      : "grid-cols-[0rem_4.5rem_1fr]",
  );

  return (
    <div className="flex items-center gap-x-2" data-testid="poll-option">
      <div className={cn(optionGrid)}>{optionSummary}</div>
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
        <VoteSegmentedControl
          value={vote}
          onChange={onChange}
          optionLabel={optionLabel}
        />
      ) : null}
    </div>
  );
};

export default PollOption;
