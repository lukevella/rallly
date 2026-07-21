import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { Dialog, DialogContent } from "@rallly/ui/dialog";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import { usePermissions, usePoll, useRole } from "@/features/poll/client";
import {
  normalizeVotes,
  useEditToken,
  useUpdateParticipantMutation,
} from "@/features/poll/components/mutations";
import { NewParticipantForm } from "@/features/poll/components/new-participant-modal";
import { useParticipants } from "@/features/poll/components/participants-provider";

const formSchema = z.object({
  mode: z.enum(["new", "edit", "view"]),
  participantId: z.string().optional(),
  votes: z.array(
    z
      .object({
        optionId: z.string(),
        type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
      })
      .optional(),
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
  const { id: pollId, options, spaceId, space } = usePoll();
  const updateParticipant = useUpdateParticipantMutation();
  const token = useEditToken();
  const { participants } = useParticipants();

  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) =>
    canEditParticipant(participant.id),
  );

  const role = useRole();
  const optionIds = options.map((option) => option.id);

  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] =
    React.useState(false);

  const form = useForm<VotingFormValues>({
    defaultValues: {
      mode:
        canAddNewParticipant && !userAlreadyVoted && role === "participant"
          ? "new"
          : "view",
      participantId:
        role === "participant"
          ? participants.find((p) => canEditParticipant(p.id))?.id
          : undefined,
      votes: options.map((option) => ({
        optionId: option.id,
      })),
    },
    resolver: zodResolver(formSchema),
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
              token,
            });

            form.reset({
              mode: "view",
              participantId: data.participantId,
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
        <DialogContent size="sm">
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
              posthog?.capture("new_participant_dialog:success_view", {
                pollId,
                spaceId,
                tier: space?.tier,
                $groups: {
                  poll: pollId,
                  ...(spaceId ? { space: spaceId } : {}),
                },
              });
            }}
            onCancel={() => setIsNewParticipantModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
};
