"use client";
import type { VoteType } from "@rallly/database";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { UsersIcon } from "lucide-react";
import type * as React from "react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  filterParticipantsByVote,
  useParticipants,
} from "@/features/poll/components/participants-provider";
import { useTranslation } from "@/i18n/client";

import { ConnectedScoreSummary } from "../score-summary";
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

const PollOption: React.FunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  editable = false,
  optionId,
  optionLabel,
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
      {children}
      <span className="flex items-center gap-x-2.5">
        <ConnectedScoreSummary optionId={optionId} />
        {editable || selectedParticipantId ? <VoteIcon type={vote} /> : null}
      </span>
    </>
  );

  return (
    <div
      className="flex items-center gap-x-2.5 bg-background p-3"
      data-testid="poll-option"
    >
      {editable ? (
        <button
          type="button"
          data-testid="vote-selector"
          aria-label={`${optionLabel}, ${voteLabel}`}
          onClick={() => {
            onChange(toggleVote(vote));
          }}
          className={cn(
            buttonVariants(),
            "h-12 min-w-0 flex-1 justify-between px-3",
          )}
        >
          {optionSummary}
        </button>
      ) : (
        <div className="flex h-12 min-w-0 flex-1 items-center justify-between px-3">
          {optionSummary}
        </div>
      )}
      <Button
        aria-label={t("showParticipantVotes", {
          defaultValue: "Show participant votes",
        })}
        size="icon-lg"
        onClick={() => {
          dialog.trigger();
        }}
      >
        <Icon>
          <UsersIcon />
        </Icon>
      </Button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{optionLabel}</DialogTitle>
          </DialogHeader>
          <PollOptionVoteSummary optionId={optionId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PollOption;
