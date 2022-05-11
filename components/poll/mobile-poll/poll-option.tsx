import { Participant, VoteType } from "@prisma/client";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

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
}

const CollapsibleContainer: React.VoidFunctionComponent<{
  expanded?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children, expanded }) => {
  return (
    <motion.div
      initial={{ width: 0 }}
      variants={{
        collapsed: {
          width: 0,
          opacity: 0,
        },
        expanded: {
          opacity: 1,
          width: 58,
        },
      }}
      animate={expanded ? "expanded" : "collapsed"}
      className={className}
    >
      {children}
    </motion.div>
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

const PollOption: React.VoidFunctionComponent<PollOptionProps> = ({
  children,
  selectedParticipantId,
  vote,
  onChange,
  participants,
  editable,
  yesScore,
  ifNeedBeScore,
}) => {
  const showVotes = !!(selectedParticipantId || editable);

  const selectorRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      data-testid="poll-option"
      onClick={() => {
        if (selectorRef.current) {
          selectorRef.current.click();
        }
      }}
      className={clsx(
        "flex select-none items-center space-x-3 px-4 py-3 transition duration-75",
        {
          "active:bg-slate-400/5": editable,
        },
      )}
    >
      <div className="flex grow items-center">
        <div className="grow">{children}</div>
        <div className="flex flex-col items-end">
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
            <VoteSelector ref={selectorRef} value={vote} onChange={onChange} />
          </div>
        ) : vote ? (
          <AnimatePresence initial={false}>
            <PopInOut
              key={vote}
              className="absolute inset-0 flex h-full w-full items-center justify-center"
            >
              <VoteIcon type={vote} />
            </PopInOut>
          </AnimatePresence>
        ) : null}
      </CollapsibleContainer>
    </div>
  );
};

export default PollOption;
