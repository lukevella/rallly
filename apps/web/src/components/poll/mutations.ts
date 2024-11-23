import { usePostHog } from "@rallly/posthog/client";

import { usePoll } from "@/components/poll-context";
import { trpc } from "@/trpc/client";

import type { ParticipantForm } from "./types";

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
  const posthog = usePostHog();
  const queryClient = trpc.useUtils();

  return trpc.polls.participants.add.useMutation({
    onSuccess: (newParticipant, input) => {
      const { pollId, name, email } = newParticipant;
      queryClient.polls.participants.list.setData(
        { pollId },
        (existingParticipants = []) => {
          return [
            { ...newParticipant, votes: input.votes },
            ...existingParticipants,
          ];
        },
      );
      posthog?.capture("add participant", {
        pollId,
        name,
        email,
      });
    },
  });
};

export const useUpdateParticipantMutation = () => {
  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  return trpc.polls.participants.update.useMutation({
    onSuccess: (participant) => {
      posthog?.capture("update participant", {
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
  const queryClient = trpc.useUtils();
  const posthog = usePostHog();
  const { poll } = usePoll();
  return trpc.polls.participants.delete.useMutation({
    onMutate: ({ participantId }) => {
      queryClient.polls.participants.list.setData(
        { pollId: poll.id },
        (existingParticipants = []) => {
          return existingParticipants.filter(({ id }) => id !== participantId);
        },
      );
    },
    onSuccess: (_, { participantId }) => {
      posthog?.capture("remove participant", {
        pollId: poll.id,
        participantId,
      });
    },
  });
};

export const useUpdatePollMutation = () => {
  const posthog = usePostHog();
  return trpc.polls.update.useMutation({
    onSuccess: (_data, { urlId }) => {
      posthog?.capture("updated poll", {
        id: urlId,
      });
    },
  });
};
