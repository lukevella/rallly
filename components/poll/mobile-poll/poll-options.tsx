import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ParsedDateTimeOpton } from "utils/date-time-utils";

import { usePoll } from "@/components/poll-context";

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
  const { getParticipantsWhoVotedForOption, getVote, getParticipantById } =
    usePoll();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  return (
    <div className="divide-y">
      {options.map((option) => {
        const participants = getParticipantsWhoVotedForOption(option.optionId);
        return (
          <Controller
            key={option.optionId}
            control={control}
            name="votes"
            render={({ field }) => {
              const vote = editable
                ? field.value.includes(option.optionId)
                  ? "yes"
                  : "no"
                : selectedParticipant
                ? getVote(selectedParticipant.id, option.optionId)
                : undefined;

              const handleChange = (newVote: "yes" | "no") => {
                if (!editable) {
                  return;
                }
                if (newVote === "no") {
                  field.onChange(
                    field.value.filter(
                      (optionId) => optionId !== option.optionId,
                    ),
                  );
                } else {
                  field.onChange([...field.value, option.optionId]);
                }
              };

              switch (option.type) {
                case "timeSlot":
                  return (
                    <TimeSlotOption
                      onChange={handleChange}
                      numberOfVotes={participants.length}
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
                      numberOfVotes={participants.length}
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
