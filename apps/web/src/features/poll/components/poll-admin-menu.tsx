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
  CalendarCheck2Icon,
  CircleStopIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import { DuplicateDialog } from "@/features/poll/components/duplicate-dialog";
import { DeletePollDialog } from "@/features/poll/components/manage-poll/delete-poll-dialog";
import { SchedulePollDialog } from "@/features/poll/components/manage-poll/schedule-poll-dialog";
import { useCsvExporter } from "@/features/poll/components/manage-poll/use-csv-exporter";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

/**
 * The poll admin header's overflow menu. Reads the poll from the legacy
 * poll context because the schedule dialog and CSV export need every
 * response's votes.
 */
export function PollAdminMenu() {
  const poll = usePoll();
  const { t } = useTranslation();
  const router = useRouter();
  const isFree = useIsFree();
  const { exportToCsv } = useCsvExporter();
  const scheduleDialog = useDialog();
  const duplicateDialog = useDialog();
  const deleteDialog = useDialog();
  // These pages are server rendered, so a status change shows once they are
  // fetched again.
  const reopenPoll = trpc.polls.reopen.useMutation({
    onSuccess: () => router.refresh(),
  });
  const closePoll = trpc.polls.close.useMutation({
    onSuccess: () => router.refresh(),
  });

  const canSchedule = poll.status === "open" || poll.status === "closed";

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
          <DropdownMenuItem onClick={exportToCsv}>
            <DownloadIcon />
            <Trans i18nKey="exportToCsv" defaults="Export to CSV" />
          </DropdownMenuItem>
          {canSchedule ? (
            <DropdownMenuItem
              onClick={() => {
                if (isFree) {
                  showPayWall({
                    from: "manage-poll",
                    action: "schedule",
                    pollId: poll.id,
                  });
                } else {
                  scheduleDialog.trigger();
                }
              }}
            >
              <CalendarCheck2Icon />
              <Trans i18nKey="schedulePoll" defaults="Schedule" />
              {isFree ? <ProBadge /> : null}
            </DropdownMenuItem>
          ) : null}
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
            <DropdownMenuItem
              onClick={() => closePoll.mutate({ pollId: poll.id })}
            >
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
      <SchedulePollDialog {...scheduleDialog.dialogProps} />
      <DuplicateDialog
        pollId={poll.id}
        pollTitle={poll.title}
        {...duplicateDialog.dialogProps}
      />
      <DeletePollDialog urlId={poll.id} {...deleteDialog.dialogProps} />
    </>
  );
}
