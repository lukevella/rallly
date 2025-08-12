import { toast } from "@rallly/ui/sonner";
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
  return trpc.polls.participants.add.useMutation();
};

export const useUpdateParticipantMutation = () => {
  const queryClient = trpc.useUtils();
  return trpc.polls.participants.update.useMutation({
    onSuccess: (participant) => {
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
  });
};

export const useUpdatePollMutation = () => {
  return trpc.polls.update.useMutation({
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        toast.error(error.message);
      }
    },
  });
};
