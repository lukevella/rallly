"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { useToast } from "@rallly/ui/hooks/use-toast";
import { Icon } from "@rallly/ui/icon";
import { CopyIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

import { DeletePollsDialog } from "./delete-polls-dialog";

export function PollActions({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const { toast } = useToast();
  const { t } = useTranslation();
  const dialog = useDialog();
  const handleCopyLink = React.useCallback(() => {
    copy(`${window.location.origin}/invite/${pollId}`);
    toast({
      title: t("copied", {
        defaultValue: "Copied",
      }),
      description: t("linkCopiedToClipboard", {
        defaultValue: "Link copied to clipboard",
      }),
    });
  }, [copy, pollId, toast, t]);

  const handleDelete = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      dialog.trigger();
    },
    [dialog],
  );

  return (
    <>
      <DropdownMenu modal={false}>
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
            <Icon>
              <CopyIcon />
            </Icon>
            <Trans i18nKey="copyLink" defaults="Copy Link" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Icon>
              <TrashIcon />
            </Icon>
            <Trans i18nKey="delete" defaults="Delete…" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePollsDialog {...dialog.dialogProps} pollIds={[pollId]} />
    </>
  );
}
