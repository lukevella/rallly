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
  CopyIcon,
  DownloadIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Settings2Icon,
  SettingsIcon,
  TableIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DuplicateDialog } from "@/app/[locale]/poll/[urlId]/duplicate-dialog";
import { trpc } from "@/app/providers";
import { FinalizePollDialog } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { ProFeatureBadge } from "@/components/pro-feature-badge";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";

function PauseResumeToggle() {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const resume = trpc.polls.resume.useMutation({
    onSuccess: (_data, vars) => {
      queryClient.polls.get.setData({ urlId: vars.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: "live",
        };
      });
      queryClient.polls.invalidate();
    },
  });
  const pause = trpc.polls.pause.useMutation({
    onSuccess: (_data, vars) => {
      queryClient.polls.get.setData({ urlId: vars.pollId }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          status: "paused",
        };
      });
      queryClient.polls.invalidate();
    },
  });

  if (poll.status === "paused") {
    return (
      <DropdownMenuItem
        onClick={() => {
          resume.mutate(
            { pollId: poll.id },
            {
              onSuccess: () => {
                queryClient.polls.get.setData({ urlId: poll.id }, (oldData) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    status: "live",
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
        <Trans i18nKey="resumePoll" />
      </DropdownMenuItem>
    );
  } else {
    return (
      <DropdownMenuItem
        onClick={() => {
          pause.mutate(
            { pollId: poll.id },
            {
              onSuccess: () => {
                queryClient.polls.get.setData({ urlId: poll.id }, (oldData) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    status: "paused",
                  };
                });
              },
            },
          );
        }}
      >
        <Icon>
          <PauseIcon />
        </Icon>
        <Trans i18nKey="pausePoll" />
      </DropdownMenuItem>
    );
  }
}

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const reopen = trpc.polls.reopen.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          event: null,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const duplicateDialog = useDialog();
  const finalizeDialog = useDialog();
  const { exportToCsv } = useCsvExporter();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild={true}>
          <Button disabled={disabled}>
            <Icon>
              <SettingsIcon />
            </Icon>
            <Trans i18nKey="manage" />
            <Icon>
              <ChevronDownIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <>
            {poll.status === "finalized" ? (
              <DropdownMenuItem
                onClick={() => {
                  reopen.mutate({ pollId: poll.id });
                }}
              >
                <Icon>
                  <RotateCcwIcon />
                </Icon>
                <Trans i18nKey="reopenPoll" defaults="Reopen" />
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  disabled={!!poll.event}
                  onClick={() => {
                    finalizeDialog.trigger();
                  }}
                >
                  <Icon>
                    <CalendarCheck2Icon />
                  </Icon>
                  <Trans i18nKey="finishPoll" defaults="Finalize" />
                  <ProFeatureBadge />
                </DropdownMenuItem>
                <PauseResumeToggle />
              </>
            )}
          </>
          <DropdownMenuSeparator />
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCsv}>
            <DropdownMenuItemIconLabel icon={DownloadIcon}>
              <Trans i18nKey="exportToCsv" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              duplicateDialog.trigger();
            }}
          >
            <DropdownMenuItemIconLabel icon={CopyIcon}>
              <Trans i18nKey="duplicate" defaults="Duplicate" />
              <ProFeatureBadge />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
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
        urlId={poll.adminUrlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
      <DuplicateDialog
        pollId={poll.id}
        pollTitle={poll.title}
        {...duplicateDialog.dialogProps}
      />
      <FinalizePollDialog {...finalizeDialog.dialogProps} />
    </>
  );
};

export default ManagePoll;
