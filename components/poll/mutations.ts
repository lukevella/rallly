import { updatePoll, UpdatePollPayload } from "api-client/update-poll";
import { usePlausible } from "next-plausible";
import { useMutation, useQueryClient } from "react-query";

import { addParticipant } from "../../api-client/add-participant";
import {
  deleteParticipant,
  DeleteParticipantPayload,
} from "../../api-client/delete-participant";
import { GetPollResponse } from "../../api-client/get-poll";
import {
  updateParticipant,
  UpdateParticipantPayload,
} from "../../api-client/update-participant";
import { usePoll } from "../poll-context";
import { useSession } from "../session";
import { ParticipantForm } from "./types";

export const useAddParticipantMutation = (pollId: string) => {
  const queryClient = useQueryClient();
  const session = useSession();
  const plausible = usePlausible();
  return useMutation(
    (payload: ParticipantForm) =>
      addParticipant({
        pollId,
        name: payload.name.trim(),
        votes: payload.votes,
      }),
    {
      onSuccess: (participant) => {
        plausible("Add participant");
        queryClient.setQueryData<GetPollResponse>(
          ["getPoll", pollId],
          (poll) => {
            if (!poll) {
              throw new Error(
                "Tried to update poll but no result found in query cache",
              );
            }
            poll.participants = [participant, ...poll.participants];
            participant.votes.forEach((vote) => {
              const votedOption = poll.options.find(
                (option) => option.id === vote.optionId,
              );
              votedOption?.votes.push(vote);
            });
            poll.options.forEach((option) => {
              participant.votes.some(({ optionId }) => optionId === option.id);
            });
            return poll;
          },
        );
        session.refresh();
      },
    },
  );
};

export const useUpdateParticipantMutation = (pollId: string) => {
  const queryClient = useQueryClient();
  const plausible = usePlausible();

  return useMutation(
    (payload: UpdateParticipantPayload) =>
      updateParticipant({
        pollId,
        participantId: payload.participantId,
        name: payload.name.trim(),
        votes: payload.votes,
      }),
    {
      onSuccess: () => {
        plausible("Update participant");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["getPoll", pollId]);
      },
    },
  );
};

export const useDeleteParticipantMutation = () => {
  const queryClient = useQueryClient();
  const plausible = usePlausible();
  return useMutation(
    (payload: DeleteParticipantPayload) => deleteParticipant(payload),
    {
      onSuccess: () => {
        plausible("Remove participant");
      },
      onSettled: (_data, _error, { pollId }) => {
        queryClient.invalidateQueries(["getPoll", pollId]);
      },
    },
  );
};

export const useUpdatePollMutation = () => {
  const { poll } = usePoll();
  const plausible = usePlausible();
  const queryClient = useQueryClient();

  return useMutation(
    (payload: UpdatePollPayload) => updatePoll(poll.urlId, payload),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["getPoll", poll.urlId], data);
        plausible("Updated poll");
      },
    },
  );
};
