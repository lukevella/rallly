"use client";

import { Button } from "@rallly/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import {
  CheckIcon,
  ClipboardCheckIcon,
  ClipboardCopy,
  ClipboardIcon,
  LinkIcon,
  TrashIcon,
} from "lucide-react";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import type { SimplifiedPoll } from "./columns";
import { DeletePollsDialog } from "./delete-polls-dialog";
import { Icon } from "@rallly/ui/icon";

export const PollActions = React.memo(function PollActions({
  poll,
}: {
  poll: SimplifiedPoll;
}) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleCopyLink = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      copy(`${window.location.origin}/invite/${poll.id}`);
      setDidCopy(true);
      setTimeout(() => {
        setDidCopy(false);
      }, 1000);
    },
    [copy, poll.id],
  );

  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
  }, []);

  return (
    <>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
              >
                <Icon>
                  {didCopy ? <ClipboardCheckIcon /> : <ClipboardIcon />}
                </Icon>
                <span className="sr-only">
                  {didCopy ? "Copied" : "Copy Invite Link"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{didCopy ? "Copied!" : "Copy Invite Link"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
              >
                <Icon>
                  <TrashIcon />
                </Icon>
                <span className="sr-only">Delete poll</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete poll</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        pollIds={[poll.id]}
        onSuccess={() => {}}
      />
    </>
  );
});
