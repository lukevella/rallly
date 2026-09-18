"use client";
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
import VoteIcon from "@/features/poll/components/vote-icon";
import { useVoteForm } from "@/features/poll/vote/components/vote-form";
import type { VotePageView } from "@/features/poll/vote/types";
import { Trans, useTranslation } from "@/i18n/client";

function SelectionCount({
  yesCount,
  ifNeedBeCount,
  allowTentativeVotes,
}: {
  yesCount: number;
  ifNeedBeCount: number;
  allowTentativeVotes: boolean;
}) {
  const { t } = useTranslation();
  return (
    <p aria-live="polite" className="flex items-center gap-4 text-sm">
      <span className="sr-only">
        {allowTentativeVotes
          ? t("optionVoteBreakdown", {
              defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
              yesScore: yesCount,
              ifNeedBeScore: ifNeedBeCount,
            })
          : t("optionVoteBreakdownYesOnly", {
              defaultValue: "{yesScore} yes",
              yesScore: yesCount,
            })}
      </span>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <VoteIcon type="yes" />
        <span className="tabular-nums">{yesCount}</span>
      </span>
      {allowTentativeVotes ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <VoteIcon type="ifNeedBe" />
          <span className="tabular-nums">{ifNeedBeCount}</span>
        </span>
      ) : null}
    </p>
  );
}

/**
 * The live selection count with the response actions: Decline and Continue
 * for a new response, Cancel and Save when editing. Absent once a response
 * is saved, which the header then summarizes.
 */
export function VotePanelFooter({
  poll,
  results,
  response,
  canVote,
}: {
  poll: VotePageView["poll"];
  results: VotePageView["results"];
  response: VotePageView["response"];
  canVote: boolean;
}) {
  const { t } = useTranslation();
  const form = useVoteForm();
  const confirmDialog = useDialog();
  const mode = form.watch("mode");
  const votes = form.watch("votes");

  if (!canVote || mode === "view") {
    return null;
  }

  const yesCount = votes.filter((vote) => vote?.type === "yes").length;
  const ifNeedBeCount = votes.filter(
    (vote) => vote?.type === "ifNeedBe",
  ).length;
  const selectedCount = yesCount + ifNeedBeCount;
  const isBlocked = !response && selectedCount === 0;

  const submitAllNo = () => {
    form.setValue(
      "votes",
      results.map((result) => ({
        optionId: result.optionId,
        type: "no" as const,
      })),
    );
    document.querySelector<HTMLFormElement>("#vote-form")?.requestSubmit();
  };

  return (
    <footer className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-t px-4 py-3">
      <SelectionCount
        yesCount={yesCount}
        ifNeedBeCount={ifNeedBeCount}
        allowTentativeVotes={poll.allowTentativeVotes}
      />
      <div className="flex items-center gap-2">
        {response ? (
          <Button
            onClick={() => {
              form.reset({
                mode: "view",
                votes: results.map((result) => ({
                  optionId: result.optionId,
                })),
              });
            }}
          >
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
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
        )}
        <Button
          form="vote-form"
          type="submit"
          variant="primary"
          aria-disabled={isBlocked}
          loading={form.formState.isSubmitting}
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
          {response ? (
            <Trans i18nKey="save" defaults="Save" />
          ) : (
            <Trans i18nKey="continue" defaults="Continue" />
          )}
        </Button>
      </div>
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
            <Button onClick={() => confirmDialog.dismiss()}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              variant="destructive"
              disabled={form.formState.isSubmitting}
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
    </footer>
  );
}
