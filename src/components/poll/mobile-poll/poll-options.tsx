import { VoteType } from "@prisma/client";
import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";

import { usePoll } from "@/components/poll-context";
import { ParsedDateTimeOpton } from "@/utils/date-time-utils";

import { ParticipantForm } from "../types";
import DateOption from "./date-option";
import TimeSlotOption from "./time-slot-option";

export interface PollOptions {
  options: ParsedDateTimeOpton[];
  editable?: boolean;
  selectedParticipantId?: string;
}

const PollOptions: React.VoidFunctionComponent<PollOptions> = ({
  options,
  editable,
  selectedParticipantId,
}) => {
  const { control } = useFormContext<ParticipantForm>();
  const {
    getParticipantsWhoVotedForOption,
    getParticipantById,
    getScore,
    getVote,
    options: allOptions,
  } = usePoll();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  return (
    <div className="divide-y">
      {options.map((option) => {
        const participants = getParticipantsWhoVotedForOption(option.optionId);
        const score = getScore(option.optionId);
        const index = allOptions.findIndex(
          ({ optionId }) => option.optionId === optionId,
        );
        return (
          <Controller
            key={option.optionId}
            control={control}
            name="votes"
            render={({ field }) => {
              const vote =
                !editable && selectedParticipant
                  ? getVote(selectedParticipant.id, option.optionId)
                  : field.value[index]?.type;

              const handleChange = (newVote: VoteType) => {
                if (!editable) {
                  return;
                }
                const newValue = [...field.value];
                newValue[index] = { optionId: option.optionId, type: newVote };
                field.onChange(newValue);
              };

              switch (option.type) {
                case "timeSlot":
                  return (
                    <TimeSlotOption
                      onChange={handleChange}
                      yesScore={score.yes}
                      ifNeedBeScore={score.ifNeedBe}
                      participants={participants}
                      vote={vote}
                      startTime={option.startTime}
                      endTime={option.endTime}
                      duration={option.duration}
                      editable={editable}
                      selectedParticipantId={selectedParticipant?.id}
                    />
                  );
                case "date":
                  return (
                    <DateOption
                      onChange={handleChange}
                      yesScore={score.yes}
                      ifNeedBeScore={score.ifNeedBe}
                      participants={participants}
                      vote={vote}
                      dow={option.dow}
                      day={option.day}
                      month={option.month}
                      editable={editable}
                      selectedParticipantId={selectedParticipant?.id}
                    />
                  );
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default PollOptions;
