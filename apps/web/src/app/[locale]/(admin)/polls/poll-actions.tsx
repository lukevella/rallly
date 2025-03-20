"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  CopyCheckIcon,
  CopyIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { Trans } from "@/components/trans";

import { DeletePollsDialog } from "./delete-polls-dialog";

export function PollActions({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleCopyLink = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      copy(`${window.location.origin}/invite/${pollId}`);
      setDidCopy(true);
      setTimeout(() => {
        setDidCopy(false);
      }, 1000);
    },
    [copy, pollId],
  );

  const handleDelete = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Icon>
              <MoreVerticalIcon />
            </Icon>
            <span className="sr-only">
              <Trans i18nKey="menu" defaults="Menu" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Icon>{didCopy ? <CopyCheckIcon /> : <CopyIcon />}</Icon>
            <Trans i18nKey="copyInviteLink" defaults="Copy Invite Link" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Icon>
              <TrashIcon />
            </Icon>
            <Trans i18nKey="delete" defaults="Delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        pollIds={[pollId]}
        onSuccess={() => {}}
      />
    </>
  );
}
