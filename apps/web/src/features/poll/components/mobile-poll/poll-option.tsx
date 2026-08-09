"use client";
import type { VoteType } from "@rallly/database";
import { buttonVariants, cn } from "@rallly/ui";
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
import VoteIcon from "../vote-icon";
import { toggleVote } from "../vote-selector";

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

const OptionScoreDonut = ({
  yesScore,
  ifNeedBeScore,
}: {
  yesScore: number;
  ifNeedBeScore: number;
}) => {
  const { participants } = useParticipants();
  const total = participants.length;
  const stroke = 4;
  const radius = (20 - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const yesLength = total > 0 ? (yesScore / total) * circumference : 0;
  const ifNeedBeLength =
    total > 0 ? (ifNeedBeScore / total) * circumference : 0;
  const segment = (className: string, length: number, offset: number) => (
    <circle
      cx="10"
      cy="10"
      r={radius}
      fill="none"
      strokeWidth={stroke}
      strokeDasharray={`${length} ${circumference}`}
      strokeDashoffset={-offset}
      className={className}
    />
  );
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-5 -rotate-90 opacity-100"
    >
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted"
      />
      {segment("stroke-[#00C950]", yesLength, 0)}
      {segment("stroke-[#FFB900]", ifNeedBeLength, yesLength)}
    </svg>
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

  const voteLabel = (() => {
    switch (vote) {
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

  const optionSummary = (
    <>
      {editable || selectedParticipantId ? (
        <VoteIcon type={vote} />
      ) : (
        <span aria-hidden="true" />
      )}
      {children}
    </>
  );

  const optionGrid =
    "grid min-w-0 flex-1 grid-cols-[1.25rem_4.5rem_1fr] items-center gap-x-2.5 px-3 text-left";

  return (
    <div className="flex items-center gap-x-1" data-testid="poll-option">
      {editable ? (
        <button
          type="button"
          data-testid="vote-selector"
          aria-label={`${optionLabel}, ${voteLabel}`}
          onClick={() => {
            onChange(toggleVote(vote));
          }}
          className={cn(buttonVariants(), optionGrid, "h-11")}
        >
          {optionSummary}
        </button>
      ) : (
        <div className={cn(optionGrid, "h-11")}>{optionSummary}</div>
      )}
      <Button
        aria-label={`${t("optionVoteBreakdown", {
          defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
          yesScore,
          ifNeedBeScore,
        })}. ${t("showParticipantVotes", {
          defaultValue: "Show participant votes",
        })}`}
        variant="ghost"
        size="icon-lg"
        className="size-11"
        onClick={() => {
          dialog.trigger();
        }}
      >
        <IfScoresVisible>
          <OptionScoreDonut yesScore={yesScore} ifNeedBeScore={ifNeedBeScore} />
        </IfScoresVisible>
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
    </div>
  );
};

export default PollOption;
