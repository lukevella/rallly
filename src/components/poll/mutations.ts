import posthog from "posthog-js";

import { trpc } from "../../utils/trpc";
import { ParticipantForm } from "./types";

export const normalizeVotes = (
  optionIds: string[],
  votes: ParticipantForm["votes"],
) => {
  return optionIds.map((optionId, i) => ({
    optionId,
    type: votes[i]?.type ?? ("no" as const),
  }));
};

export const useAddParticipantMutation = () => {
  return trpc.polls.participants.add.useMutation({
    onSuccess: (participant) => {
      posthog.capture("add participant", {
        name: participant.name,
      });
    },
  });
};

export const useUpdateParticipantMutation = () => {
  const queryClient = trpc.useContext();
  return trpc.polls.participants.update.useMutation({
    onSuccess: (participant) => {
      posthog.capture("update participant", {
        name: participant.name,
      });
      queryClient.polls.participants.list.setData(
        { pollId: participant.pollId },
        (existingParticipants = []) => {
          const newParticipants = [...existingParticipants];

          const index = newParticipants.findIndex(
            ({ id }) => id === participant.id,
          );

          if (index !== -1) {
            newParticipants[index] = participant;
          }

          return newParticipants;
        },
      );
    },
  });
};

export const useDeleteParticipantMutation = () => {
  const queryClient = trpc.useContext();
  return trpc.polls.participants.delete.useMutation({
    onMutate: ({ participantId, pollId }) => {
      queryClient.polls.participants.list.setData(
        { pollId: pollId },
        (existingParticipants = []) => {
          return existingParticipants.filter(({ id }) => id !== participantId);
        },
      );
    },
    onSuccess: (_, { participantId }) => {
      posthog.capture("remove participant", {
        participantId,
      });
    },
  });
};

export const useUpdatePollMutation = () => {
  const queryClient = trpc.useContext();
  return trpc.polls.update.useMutation({
    onSuccess: (data) => {
      queryClient.polls.invalidate();
      posthog.capture("updated poll", {
        id: data.id,
      });
    },
  });
};
