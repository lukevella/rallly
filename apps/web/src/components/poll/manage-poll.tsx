import {
  ChevronDownIcon,
  DownloadIcon,
  PencilIcon,
  SettingsIcon,
  TableIcon,
  TrashIcon,
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

import { usePoll } from "@/contexts/poll";

import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const poll = usePoll();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);

  const { exportToCsv } = useCsvExporter();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild={true}>
          <Button icon={SettingsIcon} disabled={disabled}>
            <Trans i18nKey="manage" />
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
      <DeletePollDialog
        urlId={poll.adminUrlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
    </>
  );
};

export default ManagePoll;
