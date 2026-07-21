import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
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
import { Trans } from "@/i18n/client";

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
  const { id: pollId, options } = usePoll();
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
  const [newParticipantModalView, setNewParticipantModalView] = React.useState<
    "form" | "success"
  >("form");

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
            setNewParticipantModalView("form");
            setIsNewParticipantModalOpen(true);
          }
        })}
      />
      <Dialog
        open={isNewParticipantModalOpen}
        onOpenChange={setIsNewParticipantModalOpen}
      >
        <DialogContent size="sm">
          {newParticipantModalView === "form" ? (
            <>
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
                  if (role === "participant") {
                    setNewParticipantModalView("success");
                    posthog?.capture("new_participant_dialog:success_view");
                  } else {
                    setIsNewParticipantModalOpen(false);
                  }
                }}
                onCancel={() => setIsNewParticipantModalOpen(false)}
              />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CircleCheckIcon
                  aria-hidden="true"
                  className="size-12 text-green-500"
                />
                <DialogHeader>
                  <DialogTitle>
                    <Trans
                      i18nKey="newParticipantDialogSuccessTitle"
                      defaults="Your response has been saved"
                    />
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    <Trans
                      i18nKey="newParticipantDialogSuccessDescription"
                      defaults="Thanks for responding! Did you know you can create your own poll with Rallly for free?"
                    />
                  </DialogDescription>
                </DialogHeader>
              </div>
              <DialogFooter className="sm:justify-center">
                <Button onClick={() => setIsNewParticipantModalOpen(false)}>
                  <Trans
                    i18nKey="newParticipantDialogBackToPoll"
                    defaults="Back to poll"
                  />
                </Button>
                <Link
                  href="/new"
                  className={buttonVariants({ variant: "primary" })}
                  onClick={() => {
                    posthog?.capture(
                      "new_participant_dialog:create_poll_button_click",
                    );
                  }}
                >
                  <Trans
                    i18nKey="newParticipantDialogCreatePoll"
                    defaults="Create your own poll"
                  />
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
};
