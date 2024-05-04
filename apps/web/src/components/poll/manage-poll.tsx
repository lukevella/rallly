import { Button } from "@rallly/ui/button";
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

import { ProFeatureBadge } from "@/components/pro-feature-badge";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { trpc } from "@/utils/trpc/client";

import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";

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
  const pause = trpc.polls.pause.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: true,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const resume = trpc.polls.resume.useMutation({
    onMutate: () => {
      queryClient.polls.get.setData({ urlId: poll.id }, (oldPoll) => {
        if (!oldPoll) {
          return;
        }
        return {
          ...oldPoll,
          closed: false,
        };
      });
    },
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);

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
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <>
            {poll.status === "finalized" ? (
              <DropdownMenuItem
                onSelect={() => {
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
                <DropdownMenuItem asChild disabled={!!poll.event}>
                  <Link href={`/poll/${poll.id}/finalize`}>
                    <DropdownMenuItemIconLabel icon={CalendarCheck2Icon}>
                      <Trans i18nKey="finishPoll" defaults="Finalize" />
                      <ProFeatureBadge />
                    </DropdownMenuItemIconLabel>
                  </Link>
                </DropdownMenuItem>
                {poll.status === "live" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      pause.mutate({ pollId: poll.id });
                    }}
                  >
                    <Icon>
                      <PauseIcon />
                    </Icon>
                    <Trans i18nKey="pausePoll" defaults="Pause" />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      resume.mutate({ pollId: poll.id });
                    }}
                  >
                    <Icon>
                      <PlayIcon />
                    </Icon>
                    <Trans i18nKey="resumePoll" defaults="Resume" />
                  </DropdownMenuItem>
                )}
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
          <DropdownMenuItem onClick={exportToCsv}>
            <DropdownMenuItemIconLabel icon={DownloadIcon}>
              <Trans i18nKey="exportToCsv" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/poll/${poll.id}/duplicate`}>
              <DropdownMenuItemIconLabel icon={CopyIcon}>
                <Trans i18nKey="duplicate" defaults="Duplicate" />
                <ProFeatureBadge />
              </DropdownMenuItemIconLabel>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              setShowDeletePollDialog(true);
            }}
          >
            <TrashIcon className="size-4" />
            <Trans i18nKey="deletePoll" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePollDialog
        urlId={poll.adminUrlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
    </>
  );
};

export default ManagePoll;
