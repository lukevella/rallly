import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { NewParticipantForm } from "@/components/new-participant-modal";
import { useParticipants } from "@/components/participants-provider";
import {
  normalizeVotes,
  useUpdateParticipantMutation,
} from "@/components/poll/mutations";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

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

export type VotingFormValues = z.infer<typeof formSchema>;

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

export const VotingForm = ({
  children,
  defaultValues,
}: React.PropsWithChildren<{ defaultValues?: Partial<VotingFormValues> }>) => {
  const { id: pollId, options } = usePoll();
  const updateParticipant = useUpdateParticipantMutation();

  const optionIds = options.map((option) => option.id);

  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] =
    React.useState(false);

  const form = useForm<VotingFormValues>({
    defaultValues: {
      ...defaultValues,
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
          if (data.participantId) {
            // update participant

            await updateParticipant.mutateAsync({
              participantId: data.participantId,
              pollId,
              votes: normalizeVotes(optionIds, data.votes),
            });

            form.reset({
              mode: "view",
              participantId: undefined,
              votes: options.map((option) => ({
                optionId: option.id,
              })),
            });
          } else {
            // new participant
            setIsNewParticipantModalOpen(true);
          }
        })}
      />
      <Dialog
        open={isNewParticipantModalOpen}
        onOpenChange={setIsNewParticipantModalOpen}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="newParticipant" />
            </DialogTitle>
            <DialogDescription>
              <Trans i18nKey="newParticipantFormDescription" />
            </DialogDescription>
          </DialogHeader>
          <NewParticipantForm
            votes={normalizeVotes(optionIds, form.watch("votes"))}
            onSubmit={(newParticipant) => {
              form.reset({
                mode: "view",
                participantId: newParticipant.id,
                votes: options.map((option) => ({
                  optionId: option.id,
                })),
              });
              setIsNewParticipantModalOpen(false);
            }}
            onCancel={() => setIsNewParticipantModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
};
