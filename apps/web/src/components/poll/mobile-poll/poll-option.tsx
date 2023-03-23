import { Participant, VoteType } from "@rallly/database";
import clsx from "clsx";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";

import ChevronDown from "@/components/icons/chevron-down.svg";

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
  return (
    <AnimatePresence initial={false}>
      {expanded ? (
        <m.div
          variants={{
            collapsed: {
              width: 0,
              opacity: 0,
            },
            expanded: {
              opacity: 1,
              width: "auto",
            },
          }}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className={className}
        >
          {children}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
};

const PopInOut: React.FunctionComponent<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <m.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={clsx(className)}
    >
      {children}
    </m.div>
  );
};

const PollOptionVoteSummary: React.FunctionComponent<{ optionId: string }> = ({
  optionId,
}) => {
  const { t } = useTranslation("app");
  const { getParticipants } = useParticipants();
  const participantsWhoVotedYes = getParticipants(optionId, "yes");
  const participantsWhoVotedIfNeedBe = getParticipants(optionId, "ifNeedBe");
  const participantsWhoVotedNo = getParticipants(optionId, "no");
  const noVotes =
    participantsWhoVotedYes.length + participantsWhoVotedIfNeedBe.length === 0;
  return (
    <m.div
      transition={{
        duration: 0.1,
      }}
      initial={{ height: 0, opacity: 0, y: -10 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -10 }}
      className="text-sm"
    >
      <div>
        {noVotes ? (
          <div className="rounded-lg bg-slate-50 p-2 text-center text-slate-400">
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
                  <div className="text-slate-500">{name}</div>
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
                  <div className="text-slate-500"> {name}</div>
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
                  <div className="text-slate-500"> {name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </m.div>
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
              className="ring-1 ring-white"
              name={participant.name}
            />
          );
        })}
      {participants.length > 6 ? (
        <span className="inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-medium ring-1 ring-white">
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
      className={clsx("space-y-4 overflow-hidden p-3", {
        "bg-slate-400/5": editable && active,
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
        <AnimatePresence initial={false}>
          {editable ? null : (
            <m.button
              exit={{ opacity: 0, x: -10 }}
              type="button"
              onTouchStart={(e) => e.stopPropagation()}
              className="flex min-w-0 justify-end gap-1 overflow-hidden p-1 active:bg-slate-500/10"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((value) => !value);
              }}
            >
              {participants.length > 0 ? (
                <SummarizedParticipantList participants={participants} />
              ) : null}
              <ChevronDown
                className={clsx(
                  "h-5 shrink-0 text-slate-400 transition-transform",
                  {
                    "-rotate-180": expanded,
                  },
                )}
              />
            </m.button>
          )}
        </AnimatePresence>
        <div className="mx-3">
          <ConnectedScoreSummary optionId={optionId} />
        </div>
        <CollapsibleContainer
          expanded={showVotes}
          className="relative flex justify-center"
        >
          {editable ? (
            <div className="flex h-full items-center justify-center">
              <VoteSelector
                className="w-9"
                ref={selectorRef}
                value={vote}
                onChange={onChange}
              />
            </div>
          ) : (
            <AnimatePresence initial={false} exitBeforeEnter={true}>
              <PopInOut
                key={vote}
                className="flex h-full w-9 items-center justify-center"
              >
                <VoteIcon type={vote} />
              </PopInOut>
            </AnimatePresence>
          )}
        </CollapsibleContainer>
      </div>
      <AnimatePresence initial={false}>
        {expanded && !editable ? (
          <PollOptionVoteSummary optionId={optionId} />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default PollOption;
