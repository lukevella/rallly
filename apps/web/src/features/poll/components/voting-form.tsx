import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { Dialog, DialogContent } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import {
  useParticipants,
  usePermissions,
  usePoll,
  useRole,
} from "@/features/poll/client";
import {
  normalizeVotes,
  useEditToken,
  useUpdateParticipantVotes,
} from "@/features/poll/components/mutations";
import { NewParticipantForm } from "@/features/poll/components/new-participant-modal";
import { useTranslation } from "@/i18n/client";

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

/**
 * The voting form with the participant on display resolved.
 * `selectedParticipantId` is the one the form names, or, on an aggregate
 * results poll in view mode, the viewer's own response: there is no table
 * of responses to pick from, so the viewer's answers stay on screen after
 * they cancel an edit or the poll closes.
 */
export const useVotingForm = () => {
  const { options, aggregateResultsOnly } = usePoll();
  const { participants } = useParticipants();
  const { isOwnParticipant } = usePermissions();
  const form = useFormContext<VotingFormValues>();
  const requestedParticipantId = form.watch("participantId");
  const mode = form.watch("mode");
  const selectedParticipantId =
    requestedParticipantId ??
    (aggregateResultsOnly && mode === "view"
      ? participants.find(({ id }) => isOwnParticipant(id))?.id
      : undefined);

  return {
    ...form,
    selectedParticipantId,
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

/**
 * The form a viewer votes with: it creates a response, or saves the votes
 * of the selected one.
 */
export const VotingForm = ({ children }: React.PropsWithChildren) => {
  const poll = usePoll();
  const { options } = poll;
  const { t } = useTranslation();
  const updateParticipantVotes = useUpdateParticipantVotes();
  const token = useEditToken();
  const { participants } = useParticipants();

  const { canAddNewParticipant, isOwnParticipant } = usePermissions();
  const userAlreadyVoted = participants.some((participant) =>
    isOwnParticipant(participant.id),
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
          ? participants.find((p) => isOwnParticipant(p.id))?.id
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
            const result = await updateParticipantVotes.execute({
              participantId: data.participantId,
              votes: normalizeVotes(optionIds, data.votes),
              token,
            });

            if (!result.ok) {
              // Stay in edit mode so the selection is not lost.
              toast.error(
                result.reason === "closed"
                  ? t("pollClosedDescription", {
                      defaultValue: "No more responses are being accepted.",
                    })
                  : t("actionErrorInternalServerError", {
                      defaultValue: "An internal server error occurred",
                    }),
              );
              return;
            }

            form.reset({
              mode: "view",
              participantId: data.participantId,
              votes: options.map((option) => ({
                optionId: option.id,
              })),
            });
          } else {
            // new participant
            // Plain properties, not groups, to match poll_response_submit:
            // guest events are personless and PostHog drops their groups.
            posthog?.capture("poll_response:form_open", {
              poll_id: poll.id,
              require_email: poll.requireParticipantEmail,
              tier: poll.space?.tier,
            });
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
            }}
            onCancel={() => setIsNewParticipantModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
};
