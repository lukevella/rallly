import {
  ChevronDownIcon,
  DownloadIcon,
  LockIcon,
  PencilIcon,
  SettingsIcon,
  StarIcon,
  TableIcon,
  TrashIcon,
  UnlockIcon,
} from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIconLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import Link from "next/link";
import { Trans } from "next-i18next";
import * as React from "react";

import { FinalizePollDialog } from "@/components/poll/manage-poll/finalize-poll-dialog";

import { usePoll } from "../poll-context";
import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";
import { useUpdatePollMutation } from "./mutations";

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const { poll, urlId } = usePoll();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const [isFinalizeDialogVisible, setIsFinalizeDialogVisible] =
    React.useState(false);

  const { exportToCsv } = useCsvExporter();

  const { mutate: updatePollMutation } = useUpdatePollMutation();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild={true}>
          <Button icon={SettingsIcon} disabled={disabled}>
            <span className="hidden sm:block">
              <Trans i18nKey="manage" />
            </span>
            <ChevronDownIcon className="h-4 w-4" />
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCsv}>
            <DropdownMenuItemIconLabel icon={DownloadIcon}>
              <Trans i18nKey="exportToCsv" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {poll.closed ? (
            <DropdownMenuItem
              onClick={() => updatePollMutation({ urlId, closed: false })}
            >
              <DropdownMenuItemIconLabel icon={UnlockIcon}>
                <Trans i18nKey="unlockPoll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => updatePollMutation({ urlId, closed: true })}
            >
              <DropdownMenuItemIconLabel icon={LockIcon}>
                <Trans i18nKey="lockPoll" />
              </DropdownMenuItemIconLabel>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setIsFinalizeDialogVisible(true);
            }}
          >
            <DropdownMenuItemIconLabel icon={StarIcon}>
              <Trans i18nKey="pickADate" defaults="Pick a date" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setShowDeletePollDialog(true);
            }}
          >
            <DropdownMenuItemIconLabel icon={TrashIcon}>
              <Trans i18nKey="deletePoll" />
            </DropdownMenuItemIconLabel>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FinalizePollDialog
        open={isFinalizeDialogVisible}
        onOpenChange={setIsFinalizeDialogVisible}
      />
      <DeletePollDialog
        urlId={urlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
    </>
  );
};

export default ManagePoll;
