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
  ChevronDownIcon,
  CircleStopIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Link } from "@/components/link";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { ProBadge } from "@/features/billing/components/pro-badge";
import { usePoll } from "@/features/poll/client";
import { DuplicateDialog } from "@/features/poll/components/duplicate-dialog";
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
  const isFree = useIsFree();
  const { exportToCsv } = useCsvExporter();
  // Edits made after booking would never reach the booked event.
  const canEdit = poll.status !== "scheduled";
  const canChangeStatus =
    poll.status !== "scheduled" && poll.status !== "canceled";

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
          {canEdit ? (
            <>
              <DropdownMenuItem
                render={<Link href={`/poll/${poll.id}/edit`} />}
              >
                <PencilIcon />
                <Trans i18nKey="edit" defaults="Edit" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {canChangeStatus ? (
            <>
              <OpenCloseToggle />
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={exportToCsv}>
            <DownloadIcon />
            <Trans i18nKey="exportToCsv" defaults="Export to CSV" />
          </DropdownMenuItem>
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
    </>
  );
};

export default ManagePoll;
