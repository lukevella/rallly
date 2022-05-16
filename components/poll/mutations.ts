import { usePlausible } from "next-plausible";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  UseFormProps,
} from "react-hook-form";

import { trpc } from "../../utils/trpc";
import { usePoll } from "../poll-context";
import { useSession } from "../session";
import { ParticipantForm, ParticipantFormSubmitted } from "./types";

export const useParticipantForm = (props?: UseFormProps<ParticipantForm>) => {
  const form = useForm<ParticipantForm>(props);
  const { options } = usePoll();
  return {
    ...form,
    handleSubmit: (
      onValid: SubmitHandler<ParticipantFormSubmitted>,
      onInvalid?: SubmitErrorHandler<ParticipantForm>,
    ) => {
      return form.handleSubmit((data) => {
        onValid({
          name: data.name,
          votes: options.map(
            ({ optionId }, i) =>
              data.votes[i] ?? { optionId, type: "no" as const },
          ),
        });
      }, onInvalid);
    },
  };
};

export const useAddParticipantMutation = () => {
  const queryClient = trpc.useContext();
  const session = useSession();
  const plausible = usePlausible();

  return trpc.useMutation(["polls.participants.add"], {
    onSuccess: (participant) => {
      plausible("Add participant");
      queryClient.setQueryData(
        ["polls.participants.list", { pollId: participant.pollId }],
        (existingParticipants = []) => {
          return [participant, ...existingParticipants];
        },
      );
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
