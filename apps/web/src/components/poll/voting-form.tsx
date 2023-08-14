import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { useNewParticipantModal } from "@/components/new-participant-modal";
import { useParticipants } from "@/components/participants-provider";
import {
  normalizeVotes,
  useUpdateParticipantMutation,
} from "@/components/poll/mutations";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

const formSchema = z.object({
  mode: z.enum(["new", "edit", "view"]),
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
  const { options } = usePoll();
  const { participants } = useParticipants();
  const form = useFormContext<VotingFormValues>();

  return {
    ...form,
    newParticipant: () => {
      form.reset({
        mode: "new",
        participantId: undefined,
        votes: options.map((option) => ({
          optionId: option.id,
        })),
      });
    },
    setEditingParticipantId: (newParticipantId: string) => {
      const participant = participants.find((p) => p.id === newParticipantId);
      if (participant) {
        form.reset({
          mode: "edit",
          participantId: newParticipantId,
          votes: options.map((option) => ({
            optionId: option.id,
            type: participant.votes.find((vote) => vote.optionId === option.id)
              ?.type,
          })),
        });
      } else {
        console.error("Participant not found");
      }
    },
    cancel: () =>
      form.reset({
        mode: "view",
        participantId: undefined,
        votes: options.map((option) => ({
          optionId: option.id,
        })),
      }),
  };
};

export const VotingForm = ({ children }: React.PropsWithChildren) => {
  const { id: pollId, options } = usePoll();
  const showNewParticipantModal = useNewParticipantModal();
  const updateParticipant = useUpdateParticipantMutation();
  const { participants } = useParticipants();

  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) =>
    canEditParticipant(participant.id),
  );

  const role = useRole();

  const form = useForm<VotingFormValues>({
    defaultValues: {
      mode:
        canAddNewParticipant && !userAlreadyVoted && role === "participant"
          ? "new"
          : "view",
      votes: options.map((option) => ({
        optionId: option.id,
      })),
    },
  });

  return (
    <FormProvider {...form}>
      <form
        id="voting-form"
        onSubmit={form.handleSubmit(async (data) => {
          const optionIds = options.map((option) => option.id);

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
              onSubmit: async () => {
                form.reset({
                  mode: "view",
                  participantId: undefined,
                  votes: options.map((option) => ({
                    optionId: option.id,
                  })),
                });
              },
            });
          }
        })}
      />
      {children}
    </FormProvider>
  );
};
