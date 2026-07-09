"use client";
import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import { useToggle } from "react-use";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  filterParticipantsByVote,
  useParticipants,
} from "@/components/participants-provider";
import { useTranslation } from "@/i18n/client";

import { ConnectedScoreSummary } from "../score-summary";
import VoteIcon from "../vote-icon";
import { VoteSelector } from "../vote-selector";

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
          {t("noVotes")}
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
  const showVotes = !!(selectedParticipantId || editable);
  const [isExpanded, toggle] = useToggle(false);
  return (
    <div
      className={cn(
        "relative space-y-4 bg-background p-4 transition-colors",
        editable && "active:bg-accent/50",
      )}
      data-testid="poll-option"
    >
      <div className="flex h-7 items-center justify-between gap-x-4">
        <div className="shrink-0">{children}</div>
        <div className="flex items-center gap-x-4">
          <Button
            size="sm"
            variant="ghost"
            className="relative z-10"
            onClick={() => toggle()}
          >
            <ConnectedScoreSummary optionId={optionId} />
            <Icon>{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</Icon>
          </Button>

          {showVotes ? (
            <div className="flex size-7 items-center justify-center">
              {editable ? (
                <VoteSelector
                  className="after:absolute after:inset-0"
                  optionLabel={optionLabel}
                  value={vote}
                  onChange={onChange}
                />
              ) : (
                <div
                  key={vote}
                  className="flex h-full items-center justify-center"
                >
                  <VoteIcon type={vote} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {isExpanded ? <PollOptionVoteSummary optionId={optionId} /> : null}
    </div>
  );
};

export default PollOption;
