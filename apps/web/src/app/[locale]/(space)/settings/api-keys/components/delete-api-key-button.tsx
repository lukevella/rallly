"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function DeleteApiKeyButton({
  apiKeyId,
  apiKeyName,
}: {
  apiKeyId: string;
  apiKeyName: string;
}) {
  const { t } = useTranslation();
  const deleteDialog = useDialog();
  const deleteApiKey = trpc.apiKeys.delete.useMutation();
  const utils = trpc.useUtils();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Icon>
              <MoreHorizontalIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              deleteDialog.trigger();
            }}
            className="text-destructive"
          >
            <TrashIcon className="size-4" />
            <Trans i18nKey="deleteApiKey" defaults="Delete API key" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...deleteDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="deleteApiKey" defaults="Delete API key" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="deleteApiKeyConfirmation"
                defaults="Are you sure you want to delete {name}? This action cannot be undone."
                values={{ name: apiKeyName }}
                components={{
                  b: <b className="whitespace-nowrap font-bold" />,
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                toast.promise(
                  deleteApiKey
                    .mutateAsync({
                      id: apiKeyId,
                    })
                    .then(() => {
                      utils.apiKeys.list.invalidate();
                    }),
                  {
                    loading: t("deleteApiKeyLoading", {
                      defaultValue: "Deleting API key...",
                    }),
                    success: t("deleteApiKeySuccess", {
                      defaultValue: "API key deleted successfully",
                    }),
                    error: t("deleteApiKeyError", {
                      defaultValue: "Failed to delete API key",
                    }),
                  },
                );
                deleteDialog.dismiss();
              }}
            >
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
