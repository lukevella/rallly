import { usePoll } from "@/components/poll-context";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

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
  const posthog = usePostHog();
  const queryClient = trpc.useContext();

  return trpc.polls.participants.add.useMutation({
    onSuccess: (_, { pollId, name, email }) => {
      queryClient.polls.participants.list.invalidate({ pollId });
      posthog?.capture("add participant", {
        pollId,
        name,
        email,
      });
    },
  });
};

export const useUpdateParticipantMutation = () => {
  const queryClient = trpc.useContext();
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
  const queryClient = trpc.useContext();
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
      queryClient.polls.participants.list.invalidate({ pollId: poll.id });
      posthog?.capture("remove participant", {
        pollId: poll.id,
        participantId,
      });
    },
  });
};

export const useUpdatePollMutation = () => {
  const queryClient = trpc.useContext();
  const posthog = usePostHog();
  return trpc.polls.update.useMutation({
    onSuccess: (_data, { urlId }) => {
      queryClient.polls.invalidate();
      posthog?.capture("updated poll", {
        id: urlId,
      });
    },
  });
};
