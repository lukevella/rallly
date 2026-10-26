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

import {
  usePastOptionIds,
  usePoll,
} from "@/features/poll/components/poll-context";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

function useSelection() {
  const votingForm = useVotingForm();
  const { optionIds } = usePoll();
  const pastOptionIds = usePastOptionIds();
  const selectedParticipantId = votingForm.watch("participantId");
  const votes = votingForm.watch("votes");
  const yesCount = votes.filter((vote) => vote?.type === "yes").length;
  const ifNeedBeCount = votes.filter(
    (vote) => vote?.type === "ifNeedBe",
  ).length;
  return {
    votingForm,
    votes,
    pastOptionIds,
    yesCount,
    ifNeedBeCount,
    selectedCount: yesCount + ifNeedBeCount,
    isNewResponse: !selectedParticipantId,
    // Nothing left to answer: every vote control is locked.
    allOptionsPast:
      optionIds.length > 0 &&
      optionIds.every((optionId) => pastOptionIds.has(optionId)),
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
export function DeclineButton({ className }: { className?: string }) {
  const { votingForm, votes, pastOptionIds, selectedCount, allOptionsPast } =
    useSelection();
  const confirmDialog = useDialog();

  const submitAllNo = () => {
    // Past options keep their answer: the server refuses a change to them.
    votingForm.setValue(
      "votes",
      votes.map((vote) =>
        vote && !pastOptionIds.has(vote.optionId)
          ? { ...vote, type: "no" as const }
          : vote,
      ),
    );
    document.querySelector<HTMLFormElement>("#voting-form")?.requestSubmit();
  };

  return (
    <>
      <Button
        type="button"
        className={className}
        disabled={votingForm.formState.isSubmitting || allOptionsPast}
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
 * until at least one option is selected, and any response once every option
 * has passed; the gate explains itself in a toast rather than disabling the
 * button, so it stays reachable.
 */
export function SubmitResponseButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { votingForm, selectedCount, isNewResponse, allOptionsPast } =
    useSelection();
  const isBlocked = allOptionsPast || (isNewResponse && selectedCount === 0);

  return (
    <Button
      form="voting-form"
      type="submit"
      variant="primary"
      className={className}
      aria-disabled={isBlocked}
      loading={votingForm.formState.isSubmitting}
      onClick={(event) => {
        if (isBlocked) {
          event.preventDefault();
          toast(
            allOptionsPast
              ? t("allDatesPast", { defaultValue: "Every date has passed" })
              : t("selectAtLeastOneOptionOrDecline", {
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
