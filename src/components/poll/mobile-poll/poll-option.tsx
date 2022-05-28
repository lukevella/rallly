import { Participant, VoteType } from "@prisma/client";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import ViewList from "@/components/icons/chevron-down.svg";

import { useParticipants } from "../../participants-provider";
import { ScoreSummary } from "../score-summary";
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

const CollapsibleContainer: React.VoidFunctionComponent<{
  expanded?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children, expanded }) => {
  return (
    <AnimatePresence>
      {expanded ? (
        <motion.div
          variants={{
            collapsed: {
              width: 0,
              opacity: 0,
              x: -5,
            },
            expanded: {
              opacity: 1,
              width: 58,
              x: 0,
            },
          }}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const PopInOut: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={clsx(className)}
    >
      {children}
    </motion.div>
  );
};

const PollOptionVoteSummary: React.VoidFunctionComponent<{ optionId: string }> =
  ({ optionId }) => {
    const { getParticipants } = useParticipants();
    const participantsWhoVotedYes = getParticipants(optionId, "yes");
    const participantsWhoVotedIfNeedBe = getParticipants(optionId, "ifNeedBe");
    const participantsWhoVotedNo = getParticipants(optionId, "no");
    const noVotes =
      participantsWhoVotedYes.length + participantsWhoVotedIfNeedBe.length ===
      0;
    return (
      <motion.div
        transition={{
          duration: 0.1,
        }}
        initial={{ height: 0, opacity: 0, y: -10 }}
        animate={{ height: "auto", opacity: 1, y: 0 }}
        exit={{ height: 0, opacity: 0, y: -10 }}
        className="px-4 text-sm"
      >
        <div className="space-y-2 rounded-lg border bg-white p-2 shadow-sm">
          {noVotes ? (
            <div className="text-center text-slate-400">
              No one has vote for this option
            </div>
          ) : null}
          {participantsWhoVotedYes.length > 0 ? (
            <div className="flex space-x-2">
              <div className="flex h-5 w-5 items-center justify-center">
                <VoteIcon type="yes" />
              </div>
              <div className="text-slate-500">
                {participantsWhoVotedYes.map(({ name }) => name).join(", ")}
              </div>
            </div>
          ) : null}
          {participantsWhoVotedIfNeedBe.length > 0 ? (
            <div className="flex space-x-2">
              <div className="flex h-5 w-5 items-center justify-center">
                <VoteIcon type="ifNeedBe" />
              </div>
              <div className="text-slate-500">
                {participantsWhoVotedIfNeedBe
                  .map(({ name }) => name)
                  .join(", ")}
              </div>
            </div>
          ) : null}
          {participantsWhoVotedNo.length > 0 ? (
            <div className="flex space-x-2">
              <div className="flex h-5 w-5 items-center justify-center">
                <VoteIcon type="no" />
              </div>
              <div className="text-slate-500">
                {participantsWhoVotedNo.map(({ name }) => name).join(", ")}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    );
  };

const PollOption: React.VoidFunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  participants,
  editable,
  yesScore,
  ifNeedBeScore,
  optionId,
}) => {
  const showVotes = !!(selectedParticipantId || editable);
  const [expanded, setExpanded] = React.useState(false);
  const selectorRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      className={clsx("space-y-3 py-3", {
        "active:bg-slate-400/5": editable,
      })}
      data-testid="poll-option"
      onClick={() => {
        selectorRef.current?.click();
      }}
    >
      <div
        className={clsx(
          "flex select-none items-center px-4 transition duration-75 ",
        )}
      >
        <div className="flex grow items-center">
          <div className="grow">{children}</div>
          <div className="mx-3 flex flex-col items-end">
            <ScoreSummary yesScore={yesScore} ifNeedBeScore={ifNeedBeScore} />
            {participants.length > 0 ? (
              <div className="mt-1 -mr-1">
                <div className="-space-x-1">
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
              </div>
            ) : null}
          </div>
        </div>
        <CollapsibleContainer
          expanded={showVotes}
          className="relative flex h-12 items-center justify-center rounded-lg"
        >
          {editable ? (
            <div className="flex h-full w-14 items-center justify-center">
              <VoteSelector
                ref={selectorRef}
                value={vote}
                onChange={onChange}
              />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <PopInOut
                key={vote}
                className="absolute inset-0 flex h-full w-full items-center justify-center"
              >
                <VoteIcon type={vote} />
              </PopInOut>
            </AnimatePresence>
          )}
        </CollapsibleContainer>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="h-full rounded-lg p-2 active:bg-slate-400/5"
        >
          <ViewList
            className={clsx("h-5 text-slate-400 transition-transform", {
              "rotate-180": expanded,
            })}
          />
        </button>
      </div>
      <AnimatePresence>
        {expanded ? <PollOptionVoteSummary optionId={optionId} /> : null}
      </AnimatePresence>
    </div>
  );
};

export default PollOption;
