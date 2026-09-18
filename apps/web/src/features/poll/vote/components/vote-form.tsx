"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import * as React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import {
  normalizeVotes,
  useEditToken,
  useUpdateParticipantVotes,
} from "@/features/poll/components/mutations";
import { NewParticipantForm } from "@/features/poll/components/new-participant-modal";
import type { VotePageView } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";

const schema = z.object({
  mode: z.enum(["new", "edit", "view"]),
  votes: z.array(
    z
      .object({
        optionId: z.string(),
        type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
      })
      .optional(),
  ),
});

type VoteFormValues = z.infer<typeof schema>;

export const useVoteForm = () => useFormContext<VoteFormValues>();

const emptyVotes = (results: VotePageView["results"]) =>
  results.map((result) => ({ optionId: result.optionId }));

/**
 * Owns the response being composed. Writes go through a server action and
 * the page then re-renders from the loader, so nothing is patched here.
 */
export function VoteForm({
  pollId,
  requireParticipantEmail,
  results,
  response,
  canVote,
  children,
}: {
  pollId: string;
  requireParticipantEmail: boolean;
  results: VotePageView["results"];
  response: VotePageView["response"];
  canVote: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const updateVotes = useUpdateParticipantVotes();
  const token = useEditToken();
  const [isNewParticipantOpen, setIsNewParticipantOpen] = React.useState(false);

  const optionIds = results.map((result) => result.optionId);
  const form = useForm<VoteFormValues>({
    defaultValues: {
      mode: canVote && !response ? "new" : "view",
      votes: emptyVotes(results),
    },
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...form}>
      <form
        id="vote-form"
        onSubmit={form.handleSubmit(async (data) => {
          if (!response) {
            setIsNewParticipantOpen(true);
            return;
          }

          const result = await updateVotes.execute({
            participantId: response.participantId,
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

          form.reset({ mode: "view", votes: emptyVotes(results) });
        })}
      />
      <Dialog
        open={isNewParticipantOpen}
        onOpenChange={setIsNewParticipantOpen}
      >
        <DialogContent size="sm">
          <NewParticipantForm
            pollId={pollId}
            requireParticipantEmail={requireParticipantEmail}
            votes={normalizeVotes(optionIds, form.watch("votes"))}
            onSubmit={() => {
              form.reset({ mode: "view", votes: emptyVotes(results) });
            }}
            onCancel={() => setIsNewParticipantOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
}
