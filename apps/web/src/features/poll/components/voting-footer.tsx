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
import type * as React from "react";

import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

function useSelection() {
  const votingForm = useVotingForm();
  const selectedParticipantId = votingForm.watch("participantId");
  const votes = votingForm.watch("votes");
  const yesCount = votes.filter((vote) => vote?.type === "yes").length;
  const ifNeedBeCount = votes.filter(
    (vote) => vote?.type === "ifNeedBe",
  ).length;
  return {
    votingForm,
    votes,
    yesCount,
    ifNeedBeCount,
    selectedCount: yesCount + ifNeedBeCount,
    isNewResponse: !selectedParticipantId,
  };
}

/** Yes and if need be counts of the response being edited. */
export function useSelectionCount() {
  const { yesCount, ifNeedBeCount, selectedCount } = useSelection();
  return { yesCount, ifNeedBeCount, selectedCount };
}

/**
 * Submits an all-no response, confirming first when it would discard
 * selections.
 */
export function DeclineButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { votingForm, votes, selectedCount } = useSelection();
  const confirmDialog = useDialog();

  const submitAllNo = () => {
    votingForm.setValue(
      "votes",
      votes.map((vote) => (vote ? { ...vote, type: "no" as const } : vote)),
    );
    document.querySelector<HTMLFormElement>("#voting-form")?.requestSubmit();
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        className={className}
        disabled={votingForm.formState.isSubmitting}
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
              disabled={votingForm.formState.isSubmitting}
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
    </>
  );
}

/**
 * Continue (new response) or Save (existing one). A new response is gated
 * until at least one option is selected; the gate explains itself in a toast
 * rather than disabling the button, so it stays reachable.
 */
export function SubmitResponseButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { t } = useTranslation();
  const { votingForm, selectedCount, isNewResponse } = useSelection();
  const isBlocked = isNewResponse && selectedCount === 0;

  return (
    <Button
      form="voting-form"
      type="submit"
      size={size}
      variant="primary"
      className={className}
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
  );
}

/**
 * Shared footer for the desktop and mobile voting forms. Announces the
 * selection count to screen readers, offers an explicit decline path for an
 * all-no response, and the Continue/Save submit.
 */
export const VotingFooter = ({ className }: { className?: string }) => {
  const { selectedCount } = useSelection();

  return (
    <div
      className={cn(
        "relative flex items-center gap-x-2.5 md:justify-end",
        className,
      )}
    >
      {/* Invisible, but keeps vote taps audible for screen readers. The
          wrapper is positioned so this absolutely positioned node resolves
          against it instead of the body, which would extend the document. */}
      <p aria-live="polite" className="sr-only">
        <Trans
          i18nKey="optionsSelected"
          defaults="{count, plural, =0 {None selected} one {# option selected} other {# options selected}}"
          values={{ count: selectedCount }}
        />
      </p>
      <DeclineButton className="flex-1 md:flex-none" />
      <SubmitResponseButton className="flex-2 bg-primary/80 backdrop-blur-lg aria-disabled:opacity-50 md:flex-none" />
    </div>
  );
};
