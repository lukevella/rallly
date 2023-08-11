import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { useNewParticipantModal } from "@/components/new-participant-modal";
import {
  normalizeVotes,
  useUpdateParticipantMutation,
} from "@/components/poll/mutations";
import { usePoll } from "@/contexts/poll";

const formSchema = z.object({
  participantId: z.string().optional(),
  votes: z.array(
    z.object({
      optionId: z.string(),
      type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
    }),
  ),
});

type VotingFormValues = z.infer<typeof formSchema>;

export const useVotingForm = () => {
  return useFormContext<VotingFormValues>();
};

export const VotingForm = ({ children }: React.PropsWithChildren) => {
  const { id: pollId, options } = usePoll();
  const showNewParticipantModal = useNewParticipantModal();
  const updateParticipant = useUpdateParticipantMutation();

  const optionIds = options.map((option) => option.id);

  const form = useForm<VotingFormValues>({
    defaultValues: {
      votes: options.map((option) => ({
        optionId: option.id,
      })),
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          if (data.participantId) {
            // update participant
            await updateParticipant.mutateAsync({
              participantId: data.participantId,
              pollId,
              votes: normalizeVotes(optionIds, data.votes),
            });

            form.reset({
              participantId: undefined,
              votes: options.map((option) => ({
                optionId: option.id,
              })),
            });
          } else {
            // new participant
            showNewParticipantModal({
              votes: normalizeVotes(optionIds, data.votes),
            });
          }
        })}
      >
        {children}
      </form>
    </FormProvider>
  );
};
