import { usePlausible } from "next-plausible";
import { useMutation, useQueryClient } from "react-query";

import { addParticipant } from "../../api-client/add-participant";
import {
  deleteParticipant,
  DeleteParticipantPayload,
} from "../../api-client/delete-participant";
import { updateParticipant } from "../../api-client/update-participant";
import { trpc } from "../../utils/trpc";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { usePoll } from "../poll-context";
import { useSession } from "../session";
import { ParticipantForm } from "./types";

export const useAddParticipantMutation = (pollId: string) => {
  const queryClient = useQueryClient();
  const session = useSession();
  const plausible = usePlausible();
  const { options } = usePoll();

  return useMutation(
    (payload: ParticipantForm) =>
      addParticipant({
        pollId,
        name: payload.name.trim(),
        votes: options.map(
          (option, i) =>
            payload.votes[i] ?? { optionId: option.optionId, type: "no" },
        ),
      }),
    {
      onSuccess: (participant) => {
        plausible("Add participant");
        queryClient.setQueryData<GetPollApiResponse>(
          ["getPoll", pollId],
          (poll) => {
            if (!poll) {
              throw new Error(
                "Tried to update poll but no result found in query cache",
              );
            }
            poll.participants = [participant, ...poll.participants];
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
  const { options } = usePoll();

  return useMutation(
    (payload: ParticipantForm & { participantId: string }) =>
      updateParticipant({
        pollId,
        participantId: payload.participantId,
        name: payload.name.trim(),
        votes: options.map(
          (option, i) =>
            payload.votes[i] ?? { optionId: option.optionId, type: "no" },
        ),
      }),
    {
      onSuccess: (participant) => {
        plausible("Update participant");
        queryClient.setQueryData<GetPollApiResponse>(
          ["getPoll", pollId],
          (poll) => {
            if (!poll) {
              throw new Error(
                "Tried to update poll but no result found in query cache",
              );
            }

            poll.participants = poll.participants.map((p) =>
              p.id === participant.id ? participant : p,
            );

            return poll;
          },
        );
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
  const { poll } = usePoll();
  return useMutation(
    (payload: DeleteParticipantPayload) => deleteParticipant(payload),
    {
      onMutate: ({ participantId }) => {
        queryClient.setQueryData<GetPollApiResponse>(
          ["getPoll", poll.urlId],
          (poll) => {
            if (!poll) {
              throw new Error(
                "Tried to update poll but no result found in query cache",
              );
            }

            poll.participants = poll.participants.filter(
              ({ id }) => id !== participantId,
            );

            return poll;
          },
        );
      },
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
  const queryClient = trpc.useContext();
  return trpc.useMutation(["polls.update"], {
    onSuccess: (data) => {
      queryClient.setQueryData(["polls.get", { urlId: poll.urlId }], data);
      plausible("Updated poll");
    },
  });
};
