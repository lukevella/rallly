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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, TagIcon, TrashIcon } from "lucide-react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  ChangeNameModal,
  DeleteParticipantModal,
} from "@/features/poll/components/participant-dropdown";
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
      {/* A zero says nothing the empty footer does not already say. */}
      {yesCount > 0 ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <VoteIcon type="yes" />
          <span className="tabular-nums">{yesCount}</span>
        </span>
      ) : null}
      {allowTentativeVotes && ifNeedBeCount > 0 ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5">
          <VoteIcon type="ifNeedBe" />
          <span className="tabular-nums">{ifNeedBeCount}</span>
        </span>
      ) : null}
    </p>
  );
}

/**
 * The response and its actions. While composing, that is the live selection
 * count with Decline and Continue, or Cancel and Save when editing. Once a
 * response is saved it becomes the participant's name with Edit and an
 * overflow menu, so the panel header is left to display settings alone.
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
  const changeNameDialog = useDialog();
  const deleteDialog = useDialog();
  const mode = form.watch("mode");
  const votes = form.watch("votes");

  if (response && mode === "view") {
    return (
      // Keyed so React remounts rather than reusing the composing footer's
      // DOM nodes. Both branches render the same shape, so without this the
      // button under the pointer is reused: a click on Edit finishes on the
      // Save button that takes its place and submits the response.
      <footer
        key="saved"
        className="sticky bottom-0 z-10 flex min-h-16 shrink-0 items-center justify-between gap-4 bg-card px-4 py-3 lg:static lg:bg-transparent"
      >
        <div className="flex min-w-0 items-center gap-2">
          <OptimizedAvatarImage
            size="sm"
            name={response.name}
            src={response.image ?? undefined}
            className="shrink-0"
          />
          <p className="truncate font-medium text-sm">{response.name}</p>
        </div>
        {canVote ? (
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                data-testid="participant-menu"
                render={
                  <Button
                    aria-label={t("moreOptions", {
                      defaultValue: "More options",
                    })}
                    variant="ghost"
                    size="icon"
                  >
                    <MoreHorizontalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeNameDialog.trigger()}>
                  <TagIcon />
                  <Trans i18nKey="changeName" defaults="Change name" />
                </DropdownMenuItem>
                {/* Removing the response entirely is rarer than changing it
                    to a no, so it sits in the menu rather than beside Edit. */}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => deleteDialog.trigger()}
                >
                  <TrashIcon />
                  <Trans i18nKey="delete" defaults="Delete" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                form.reset({
                  mode: "edit",
                  votes: results.map((result) => ({
                    optionId: result.optionId,
                    type: response.votes.find(
                      (vote) => vote.optionId === result.optionId,
                    )?.type,
                  })),
                });
              }}
            >
              <Trans i18nKey="edit" defaults="Edit" />
            </Button>
            <ChangeNameModal
              {...changeNameDialog.dialogProps}
              oldName={response.name}
              participantId={response.participantId}
            />
            <DeleteParticipantModal
              {...deleteDialog.dialogProps}
              participantId={response.participantId}
              participantName={response.name}
            />
          </div>
        ) : null}
      </footer>
    );
  }

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
    // Below lg the page scrolls, so the footer pins to the viewport rather
    // than scrolling away from the options it acts on. Keyed to match the
    // saved footer above, so the two never share DOM nodes.
    <footer
      key="composing"
      className="sticky bottom-0 z-10 flex min-h-16 shrink-0 items-center justify-between gap-4 bg-card px-4 py-3 lg:static lg:bg-transparent"
    >
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
