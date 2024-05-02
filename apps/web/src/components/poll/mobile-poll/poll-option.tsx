"use client";
import { Participant, VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { useToggle } from "react-use";

import { useTranslation } from "@/app/i18n/client";
import { useParticipants } from "@/components/participants-provider";
import { UserAvatar } from "@/components/user";
import { IfParticipantsVisible } from "@/components/visibility";

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
  participants: Participant[];
  selectedParticipantId?: string;
  optionId: string;
}

const PollOptionVoteSummary: React.FunctionComponent<{ optionId: string }> = ({
  optionId,
}) => {
  const { t } = useTranslation();
  const { getParticipants } = useParticipants();
  const participantsWhoVotedYes = getParticipants(optionId, "yes");
  const participantsWhoVotedIfNeedBe = getParticipants(optionId, "ifNeedBe");
  const participantsWhoVotedNo = getParticipants(optionId, "no");
  const noVotes =
    participantsWhoVotedYes.length + participantsWhoVotedIfNeedBe.length === 0;
  return (
    <div>
      {noVotes ? (
        <div className="rounded-lg bg-gray-50 p-2 text-center text-gray-500">
          {t("noVotes")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <div className="col-span-1 space-y-2.5">
            {participantsWhoVotedYes.map(({ name }, i) => (
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-5 items-center justify-center">
                  <UserAvatar size="xs" name={name} />
                  <VoteIcon
                    type="yes"
                    size="sm"
                    className="absolute bottom-full left-full -translate-x-1/2 translate-y-1/2 rounded-full bg-white"
                  />
                </div>
                <div className="truncate text-sm">{name}</div>
              </div>
            ))}
          </div>
          <div className="col-span-1 space-y-2.5">
            {participantsWhoVotedIfNeedBe.map(({ name }, i) => (
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-5 items-center justify-center">
                  <UserAvatar size="xs" name={name} />
                  <VoteIcon
                    type="ifNeedBe"
                    size="sm"
                    className="absolute bottom-full left-full -translate-x-1/2 translate-y-1/2 rounded-full bg-white"
                  />
                </div>
                <div className="truncate text-sm"> {name}</div>
              </div>
            ))}
            {participantsWhoVotedNo.map(({ name }, i) => (
              <div key={i} className="flex">
                <div className="relative mr-2.5 flex size-5 items-center justify-center">
                  <UserAvatar size="xs" name={name} />
                  <VoteIcon
                    type="no"
                    size="sm"
                    className="absolute bottom-full left-full -translate-x-1/2 translate-y-1/2 rounded-full bg-white"
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
}) => {
  const showVotes = !!(selectedParticipantId || editable);
  const selectorRef = React.useRef<HTMLButtonElement>(null);
  const [active, setActive] = React.useState(false);
  const [isExpanded, toggle] = useToggle(false);
  return (
    <div
      className={cn("relative flex items-start bg-white", {
        "bg-gray-500/5": editable && active,
      })}
      onPointerDown={() => setActive(editable)}
      onPointerUp={() => setActive(false)}
      onPointerOut={() => setActive(false)}
      data-testid="poll-option"
      onClick={() => {
        selectorRef.current?.click();
      }}
    >
      <div className="grow space-y-4 p-4">
        <div className="flex items-center">
          <div className="flex h-7 grow items-center gap-x-4">
            <div className="shrink-0 grow ">{children}</div>
            {showVotes ? (
              <div className="relative flex size-7 items-center justify-center">
                {editable ? (
                  <VoteSelector
                    ref={selectorRef}
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
            ) : (
              <div className="flex items-center gap-x-2.5">
                <ConnectedScoreSummary optionId={optionId} />
                <IfParticipantsVisible>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle();
                    }}
                  >
                    <Icon>
                      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </Icon>
                  </Button>
                </IfParticipantsVisible>
              </div>
            )}
          </div>
        </div>
        {isExpanded ? <PollOptionVoteSummary optionId={optionId} /> : null}
      </div>
    </div>
  );
};

export default PollOption;
