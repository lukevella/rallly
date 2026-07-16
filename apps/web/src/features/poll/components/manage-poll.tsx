import { posthog } from "@rallly/posthog/client";
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
  ChevronDownIcon,
  CircleStopIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
  Settings2Icon,
  TableIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { DuplicateDialog } from "@/app/[locale]/(optional-space)/poll/[urlId]/duplicate-dialog";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import { SchedulePollDialog } from "@/features/poll/components/manage-poll/schedule-poll-dialog";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";

function OpenCloseToggle() {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const openPoll = trpc.polls.reopen.useMutation({
    onSuccess: (_data, vars) => {
      queryClient.polls.get.setData({ urlId: vars.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: "open",
        };
      });
    },
  });
  const closePoll = trpc.polls.close.useMutation({
    onSuccess: (_data, vars) => {
      queryClient.polls.get.setData({ urlId: vars.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: "closed",
        };
      });
    },
  });

  if (poll.status === "closed") {
    return (
      <DropdownMenuItem
        onClick={() => {
          openPoll.mutate(
            { pollId: poll.id },
            {
              onSuccess: () => {
                queryClient.polls.get.setData({ urlId: poll.id }, (oldData) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    status: "open",
                  };
                });
              },
            },
          );
        }}
      >
        <PlayIcon />
        <Trans i18nKey="reopenPoll" defaults="Reopen" />
      </DropdownMenuItem>
    );
  } else {
    return (
      <DropdownMenuItem
        onClick={() => {
          closePoll.mutate(
            { pollId: poll.id },
            {
              onSuccess: () => {
                queryClient.polls.get.setData({ urlId: poll.id }, (oldData) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    status: "closed",
                  };
                });
              },
            },
          );
        }}
      >
        <CircleStopIcon />
        <Trans i18nKey="closePoll" defaults="Close" />
      </DropdownMenuItem>
    );
  }
}

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const poll = usePoll();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const duplicateDialog = useDialog();
  const scheduleDialog = useDialog();
  const isFree = useIsFree();
  const { exportToCsv } = useCsvExporter();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" disabled={disabled} />}
        >
          <span>
            <Trans i18nKey="manage" />
          </span>
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={`/poll/${poll.id}/edit-details`} />}
          >
            <PencilIcon />
            <Trans i18nKey="editDetails" />
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/poll/${poll.id}/edit-options`} />}
          >
            <TableIcon />
            <Trans i18nKey="editOptions" />
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/poll/${poll.id}/edit-settings`} />}
          >
            <Settings2Icon />
            <Trans i18nKey="editSettings" defaults="Edit settings" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {poll.status === "scheduled" || poll.status === "canceled" ? null : (
            <>
              <DropdownMenuItem
                disabled={!!poll.event}
                onClick={() => {
                  if (isFree) {
                    showPayWall();
                    posthog?.capture("trigger paywall", {
                      poll_id: poll.id,
                      from: "manage-poll",
                      action: "schedule",
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
              <OpenCloseToggle />
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCsv}>
            <DownloadIcon />
            <Trans i18nKey="exportToCsv" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (isFree) {
                showPayWall();
                posthog?.capture("trigger paywall", {
                  poll_id: poll.id,
                  action: "duplicate",
                  from: "manage-poll",
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setShowDeletePollDialog(true);
            }}
          >
            <TrashIcon />
            <Trans i18nKey="delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePollDialog
        urlId={poll.id}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
      <DuplicateDialog
        pollId={poll.id}
        pollTitle={poll.title}
        {...duplicateDialog.dialogProps}
      />
      <SchedulePollDialog {...scheduleDialog.dialogProps} />
    </>
  );
};

export default ManagePoll;
