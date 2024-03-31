"use client";
import { Participant, VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { IfParticipantsVisible } from "@/components/visibility";

import { useParticipants } from "../../participants-provider";
import { ConnectedScoreSummary } from "../score-summary";
import UserAvatar from "../user-avatar";
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

const CollapsibleContainer: React.FunctionComponent<{
  expanded?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children, expanded }) => {
  return expanded ? <div className={className}>{children}</div> : null;
};

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
    <div className="text-sm">
      <div>
        {noVotes ? (
          <div className="rounded-lg bg-gray-50 p-2 text-center text-gray-500">
            {t("noVotes")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            <div className="col-span-1 space-y-2">
              {participantsWhoVotedYes.map(({ name }, i) => (
                <div key={i} className="flex">
                  <div className="relative mr-2 flex items-center justify-center">
                    <UserAvatar name={name} />
                    <VoteIcon
                      type="yes"
                      size="sm"
                      className="absolute -right-1 -top-1 rounded-full bg-white"
                    />
                  </div>
                  <div className="text-gray-500">{name}</div>
                </div>
              ))}
            </div>
            <div className="col-span-1 space-y-2">
              {participantsWhoVotedIfNeedBe.map(({ name }, i) => (
                <div key={i} className="flex">
                  <div className="relative mr-2 flex items-center justify-center">
                    <UserAvatar name={name} />
                    <VoteIcon
                      type="ifNeedBe"
                      size="sm"
                      className="absolute -right-1 -top-1 rounded-full bg-white"
                    />
                  </div>
                  <div className="text-gray-500"> {name}</div>
                </div>
              ))}
              {participantsWhoVotedNo.map(({ name }, i) => (
                <div key={i} className="flex">
                  <div className="relative mr-2 flex items-center justify-center">
                    <UserAvatar name={name} />
                    <VoteIcon
                      type="no"
                      size="sm"
                      className="absolute -right-1 -top-1 rounded-full bg-white"
                    />
                  </div>
                  <div className="text-gray-500"> {name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummarizedParticipantList: React.FunctionComponent<{
  participants: Participant[];
}> = ({ participants }) => {
  return (
    <div className="flex -space-x-1">
      {participants
        .slice(0, participants.length <= 6 ? 6 : 5)
        .map((participant, i) => {
          return (
            <UserAvatar
              key={i}
              className="ring-2 ring-white"
              name={participant.name}
            />
          );
        })}
      {participants.length > 6 ? (
        <span className="inline-flex h-5 items-center justify-center rounded-full bg-gray-100 px-1 text-xs font-medium ring-1 ring-white">
          +{participants.length - 5}
        </span>
      ) : null}
    </div>
  );
};

const PollOption: React.FunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  participants,
  editable = false,
  optionId,
}) => {
  const showVotes = !!(selectedParticipantId || editable);
  const [expanded, setExpanded] = React.useState(false);
  const selectorRef = React.useRef<HTMLButtonElement>(null);
  const [active, setActive] = React.useState(false);

  return (
    <div
      className={cn("space-y-4 px-4 py-3", {
        "bg-gray-500/5": editable && active,
      })}
      onTouchStart={() => setActive(editable)}
      onTouchEnd={() => setActive(false)}
      data-testid="poll-option"
      onClick={() => {
        selectorRef.current?.click();
      }}
    >
      <div className="flex select-none items-center transition duration-75">
        <div className="mr-3 shrink-0 grow">{children}</div>
        {editable ? null : (
          <button
            type="button"
            onTouchStart={(e) => e.stopPropagation()}
            className="flex min-w-0 justify-end gap-1 overflow-hidden p-1 active:bg-gray-500/10"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((value) => !value);
            }}
          >
            <IfParticipantsVisible>
              {participants.length > 0 ? (
                <SummarizedParticipantList participants={participants} />
              ) : null}
              <ChevronDownIcon
                className={cn(
                  "h-5 shrink-0 text-gray-500 transition-transform",
                  {
                    "-rotate-180": expanded,
                  },
                )}
              />
            </IfParticipantsVisible>
          </button>
        )}
        <div className="mx-3">
          <ConnectedScoreSummary optionId={optionId} />
        </div>
        <CollapsibleContainer
          expanded={showVotes}
          className="relative flex justify-center"
        >
          {editable ? (
            <div className="relative flex h-full w-9 items-center justify-center">
              <VoteSelector
                ref={selectorRef}
                value={vote}
                onChange={onChange}
              />
            </div>
          ) : (
            <div
              key={vote}
              className="flex h-full w-9 items-center justify-center"
            >
              <VoteIcon type={vote} />
            </div>
          )}
        </CollapsibleContainer>
      </div>
      {expanded && !editable ? (
        <PollOptionVoteSummary optionId={optionId} />
      ) : null}
    </div>
  );
};

export default PollOption;
