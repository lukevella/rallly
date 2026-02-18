import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarCheck2Icon,
  ChevronDownIcon,
  CircleStopIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
  Settings2Icon,
  SettingsIcon,
  TableIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DuplicateDialog } from "@/app/[locale]/(optional-space)/poll/[urlId]/duplicate-dialog";
import { SchedulePollDialog } from "@/components/poll/manage-poll/schedule-poll-dialog";
import { ProBadge } from "@/components/pro-badge";
import { usePoll } from "@/contexts/poll";
import { useBilling } from "@/features/billing/client";
import { useSpace } from "@/features/space/client";
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
        <Icon>
          <PlayIcon />
        </Icon>
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
        <Icon>
          <CircleStopIcon />
        </Icon>
        <Trans i18nKey="closePoll" defaults="Close" />
      </DropdownMenuItem>
    );
  }
}

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const poll = usePoll();
  const space = useSpace();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const duplicateDialog = useDialog();
  const scheduleDialog = useDialog();
  const { showPayWall } = useBilling();
  const posthog = usePostHog();
  const { exportToCsv } = useCsvExporter();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="ghost" disabled={disabled}>
            <Icon>
              <SettingsIcon />
            </Icon>
            <span className="hidden sm:block">
              <Trans i18nKey="manage" />
            </span>
            <Icon>
              <ChevronDownIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/poll/${poll.id}/edit-details`}>
              <DropdownMenuItemIconLabel icon={PencilIcon}>
                <Trans i18nKey="editDetails" />
              </DropdownMenuItemIconLabel>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/poll/${poll.id}/edit-options`}>
              <DropdownMenuItemIconLabel icon={TableIcon}>
                <Trans i18nKey="editOptions" />
              </DropdownMenuItemIconLabel>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/poll/${poll.id}/edit-settings`}>
              <DropdownMenuItemIconLabel icon={Settings2Icon}>
                <Trans i18nKey="editSettings" defaults="Edit settings" />
              </DropdownMenuItemIconLabel>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {poll.status === "scheduled" || poll.status === "canceled" ? null : (
            <>
              <DropdownMenuItem
                disabled={!!poll.event}
                onClick={() => {
                  if (space.data.tier !== "pro") {
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
                <Icon>
                  <CalendarCheck2Icon />
                </Icon>
                <Trans i18nKey="schedulePoll" defaults="Schedule" />
                {space.data.tier !== "pro" ? <ProBadge /> : null}
              </DropdownMenuItem>
              <OpenCloseToggle />
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCsv}>
            <DropdownMenuItemIconLabel icon={DownloadIcon}>
              <Trans i18nKey="exportToCsv" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (space.data.tier !== "pro") {
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
            <DropdownMenuItemIconLabel icon={CopyIcon}>
              <Trans i18nKey="duplicate" defaults="Duplicate" />
              {space.data.tier !== "pro" ? <ProBadge /> : null}
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setShowDeletePollDialog(true);
            }}
          >
            <TrashIcon className="size-4 opacity-75" />
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
