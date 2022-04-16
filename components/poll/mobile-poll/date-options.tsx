import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { ParsedDateOption } from "utils/date-time-utils";

import DateCard from "@/components/date-card";
import { usePoll } from "@/components/poll-context";

import UserAvater from "../user-avatar";
import VoteIcon from "../vote-icon";

export interface DateOptionsProps {
  options: ParsedDateOption[];
  editable?: boolean;
  selectedParticipantId?: string;
}

const DateOptions: React.VoidFunctionComponent<DateOptionsProps> = ({
  options,
  editable,
  selectedParticipantId,
}) => {
  const highScore = 0;
  const { t } = useTranslation("app");
  const { register } = useFormContext();
  const { getVotesForOption, getVote, getParticipantById } = usePoll();
  return (
    <div className="divide-y">
      {options.map((option, i) => {
        const votes = getVotesForOption(option.optionId);
        const numVotes = votes.length;
        return (
          <div key={i} className="flex items-center space-x-4 px-4 py-2">
            <div>
              <DateCard
                day={option.day}
                dow={option.dow}
                month={option.month}
              />
            </div>
            <div className="grow items-center space-y-1">
              <div>
                <span
                  className={clsx(
                    "inline-block rounded-full border px-2 text-xs leading-relaxed",
                    {
                      "border-slate-200": numVotes !== highScore,
                      "border-rose-500 text-rose-500": numVotes === highScore,
                    },
                  )}
                >
                  {t("voteCount", { count: numVotes })}
                </span>
              </div>
              {votes.length ? (
                <div className="-space-x-1">
                  {votes.slice(0, votes.length <= 6 ? 6 : 5).map((vote) => {
                    const participant = getParticipantById(vote.participantId);
                    return (
                      <UserAvater
                        key={vote.id}
                        className="ring-1 ring-white"
                        name={participant.name}
                      />
                    );
                  })}
                  {votes.length > 6 ? (
                    <span className="inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-medium ring-1 ring-white">
                      +{votes.length - 5}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex h-14 w-12 items-center justify-center">
              {editable ? (
                <input
                  type="checkbox"
                  className="checkbox"
                  value={option.optionId}
                  {...register("votes")}
                />
              ) : selectedParticipantId ? (
                <VoteIcon
                  type={getVote(selectedParticipantId, option.optionId)}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DateOptions;
