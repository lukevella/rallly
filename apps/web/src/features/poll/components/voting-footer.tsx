"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";

import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Shared footer for the desktop and mobile voting forms. Announces the
 * selection count to screen readers, offers an explicit decline path for an
 * all-no response (confirming first if it would discard selections), and the
 * Continue/Save submit which is gated until a new participant selects at
 * least one option.
 */
export const VotingFooter = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const votingForm = useVotingForm();
  const confirmDialog = useDialog();

  const selectedParticipantId = votingForm.watch("participantId");
  const votes = votingForm.watch("votes");
  const selectedCount = votes.filter(
    (vote) => vote?.type === "yes" || vote?.type === "ifNeedBe",
  ).length;
  const isNewResponse = !selectedParticipantId;
  const isBlocked = isNewResponse && selectedCount === 0;

  const submitAllNo = () => {
    votingForm.setValue(
      "votes",
      votes.map((vote) => (vote ? { ...vote, type: "no" as const } : vote)),
    );
    document.querySelector<HTMLFormElement>("#voting-form")?.requestSubmit();
  };

  return (
    <div
      className={cn("flex items-center gap-x-2.5 md:justify-end", className)}
    >
      {/* Invisible, but keeps vote taps audible for screen readers. */}
      <p aria-live="polite" className="sr-only">
        <Trans
          i18nKey="optionsSelected"
          defaults="{count, plural, =0 {None selected} one {# option selected} other {# options selected}}"
          values={{ count: selectedCount }}
        />
      </p>
      <Button
        type="button"
        className="flex-1 md:flex-none"
        onClick={() => {
          if (selectedCount > 0) {
            confirmDialog.trigger();
          } else {
            submitAllNo();
          }
        }}
      >
        <Trans i18nKey="decline" defaults="Decline" />
      </Button>
      <Button
        form="voting-form"
        type="submit"
        variant="primary"
        className="flex-[2] aria-disabled:opacity-50 md:flex-none"
        aria-disabled={isBlocked}
        loading={votingForm.formState.isSubmitting}
        onClick={(event) => {
          if (isBlocked) {
            event.preventDefault();
            toast(
              t("selectAtLeastOneOptionOrDecline", {
                defaultValue: "Select at least one option, or decline",
              }),
            );
          }
        }}
      >
        {isNewResponse ? (
          <Trans i18nKey="continue" defaults="Continue" />
        ) : (
          <Trans i18nKey="save" defaults="Save" />
        )}
      </Button>
      <Dialog {...confirmDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="declineConfirmTitle" defaults="Decline?" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="declineConfirmDescription"
                defaults="{count, plural, one {This will discard your selected option and respond no to everything.} other {This will discard your # selected options and respond no to everything.}}"
                values={{ count: selectedCount }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                confirmDialog.dismiss();
              }}
            >
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmDialog.dismiss();
                submitAllNo();
              }}
            >
              <Trans i18nKey="decline" defaults="Decline" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
