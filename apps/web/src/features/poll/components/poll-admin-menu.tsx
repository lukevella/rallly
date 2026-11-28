"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import {
  CircleStopIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/link";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import { ClosePollDialog } from "@/features/poll/components/close-poll-dialog";
import { DuplicateDialog } from "@/features/poll/components/duplicate-dialog";
import { DeletePollDialog } from "@/features/poll/components/manage-poll/delete-poll-dialog";
import {
  getOpenPollLimitRefusal,
  showOpenPollLimit,
} from "@/features/poll/limit/client";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

/** The poll admin header's overflow menu. Reads the poll from the poll context. */
export function PollAdminMenu() {
  const poll = usePoll();
  const { t } = useTranslation();
  const router = useRouter();
  const isFree = useIsFree();
  const duplicateDialog = useDialog();
  const deleteDialog = useDialog();
  const closeDialog = useDialog();
  // These pages are server rendered, so a status change shows once they are
  // fetched again.
  const reopenPoll = trpc.polls.reopen.useMutation({
    onSuccess: (res) => {
      const refusal = getOpenPollLimitRefusal(res);
      if (refusal) {
        showOpenPollLimit("reopen", refusal.usage);
        return;
      }
      router.refresh();
    },
  });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("pollAdminMenu", { defaultValue: "Poll options" })}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {poll.status === "scheduled" ? null : (
            <>
              <DropdownMenuItem
                render={<Link href={`/poll/${poll.id}/edit?from=admin`} />}
              >
                <PencilIcon />
                <Trans i18nKey="edit" defaults="Edit" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => {
              if (isFree) {
                showPayWall({
                  from: "manage-poll",
                  action: "duplicate",
                  pollId: poll.id,
                });
              } else {
                duplicateDialog.trigger();
              }
            }}
          >
            <CopyIcon />
            <Trans i18nKey="duplicate" defaults="Duplicate" />
            {isFree ? <ProBadge /> : null}
          </DropdownMenuItem>
          {poll.status === "open" ? (
            <DropdownMenuItem onClick={() => closeDialog.trigger()}>
              <CircleStopIcon />
              <Trans i18nKey="closePoll" defaults="Close" />
            </DropdownMenuItem>
          ) : null}
          {poll.status === "closed" ? (
            <DropdownMenuItem
              onClick={() => reopenPoll.mutate({ pollId: poll.id })}
            >
              <PlayIcon />
              <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteDialog.trigger()}
          >
            <TrashIcon />
            <Trans i18nKey="delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DuplicateDialog
        pollId={poll.id}
        pollTitle={poll.title}
        {...duplicateDialog.dialogProps}
      />
      <DeletePollDialog urlId={poll.id} {...deleteDialog.dialogProps} />
      <ClosePollDialog pollId={poll.id} {...closeDialog.dialogProps} />
    </>
  );
}
