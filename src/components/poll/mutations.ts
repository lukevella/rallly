import { usePlausible } from "next-plausible";

import { trpc } from "../../utils/trpc";
import { usePoll } from "../poll-context";
import { useSession } from "../session";
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
  const queryClient = trpc.useContext();
  const session = useSession();
  const plausible = usePlausible();

  return trpc.useMutation(["polls.participants.add"], {
    onMutate: (participant) => {
      queryClient.setQueryData(
        ["polls.participants.list", { pollId: participant.pollId }],
        (existingParticipants = []) => {
          const now = new Date();
          return [
            ...existingParticipants,
            {
              id: "temp",
              userId: session.user?.id,
              createdAt: now,
              updatedAt: null,
              ...participant,
              votes: participant.votes.map((vote, i) => ({
                createdAt: now,
                participantId: "temp",
                id: `vote-${i}`,
                pollId: participant.pollId,
                updatedAt: null,
                ...vote,
              })),
            },
          ];
        },
      );
    },
    onSuccess: (participant) => {
      plausible("Add participant");
      queryClient.invalidateQueries([
        "polls.participants.list",
        { pollId: participant.pollId },
      ]);
      session.refresh();
    },
  });
};

export const useUpdateParticipantMutation = () => {
  const queryClient = trpc.useContext();
  const plausible = usePlausible();
  return trpc.useMutation("polls.participants.update", {
    onSuccess: (participant) => {
      plausible("Update participant");
      queryClient.setQueryData(
        ["polls.participants.list", { pollId: participant.pollId }],
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
  const plausible = usePlausible();
  return trpc.useMutation("polls.participants.delete", {
    onMutate: ({ participantId, pollId }) => {
      queryClient.setQueryData(
        ["polls.participants.list", { pollId: pollId }],
        (existingParticipants = []) => {
          return existingParticipants.filter(({ id }) => id !== participantId);
        },
      );
    },
    onSuccess: () => {
      plausible("Remove participant");
    },
  });
};

export const useUpdatePollMutation = () => {
  const { urlId, admin } = usePoll();
  const plausible = usePlausible();
  const queryClient = trpc.useContext();
  return trpc.useMutation(["polls.update"], {
    onSuccess: (data) => {
      queryClient.setQueryData(["polls.get", { urlId, admin }], data);
      plausible("Updated poll");
    },
  });
};
