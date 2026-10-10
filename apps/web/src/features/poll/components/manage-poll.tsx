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
import { useRouter } from "next/navigation";
import * as React from "react";
import { DuplicateDialog } from "@/app/[locale]/(optional-space)/poll/[urlId]/duplicate-dialog";
import { Link } from "@/components/link";
import { TrialProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import { SchedulePollDialog } from "@/features/poll/components/manage-poll/schedule-poll-dialog";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";

function OpenCloseToggle() {
  const poll = usePoll();
  const router = useRouter();
  // The poll is served from the layout's server props; the refresh is
  // what makes the new status show.
  const openPoll = trpc.polls.reopen.useMutation({
    onSuccess: () => router.refresh(),
  });
  const closePoll = trpc.polls.close.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (poll.status === "closed") {
    return (
      <DropdownMenuItem
        onClick={() => {
          openPoll.mutate({ pollId: poll.id });
        }}
      >
        <PlayIcon />
        <Trans i18nKey="reopenPoll" defaults="Reopen poll" />
      </DropdownMenuItem>
    );
  } else {
    return (
      <DropdownMenuItem
        onClick={() => {
          closePoll.mutate({ pollId: poll.id });
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
              {/* Paid, but never a pay wall from here: the dialog carries
                  the terms and its button starts the 14 free days. */}
              <DropdownMenuItem
                disabled={!!poll.event}
                onClick={() => scheduleDialog.trigger()}
              >
                <CalendarCheck2Icon />
                <Trans i18nKey="schedulePoll" defaults="Schedule" />
                <TrialProBadge />
              </DropdownMenuItem>
              <OpenCloseToggle />
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCsv}>
            <DownloadIcon />
            <Trans i18nKey="exportToCsv" defaults="Export to CSV" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicateDialog.trigger()}>
            <CopyIcon />
            <Trans i18nKey="duplicate" defaults="Duplicate" />
            <TrialProBadge />
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
