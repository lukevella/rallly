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
import { BanIcon, MoreHorizontalIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function RevokeApiKeyButton({
  apiKeyId,
  apiKeyName,
}: {
  apiKeyId: string;
  apiKeyName: string;
}) {
  const { t } = useTranslation();
  const revokeDialog = useDialog();
  const revokeApiKey = trpc.apiKeys.revoke.useMutation();
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
              revokeDialog.trigger();
            }}
            className="text-destructive"
          >
            <BanIcon className="size-4" />
            <Trans i18nKey="revokeApiKey" defaults="Revoke API key" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...revokeDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="revokeApiKey" defaults="Revoke API key" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="revokeApiKeyConfirmation"
                defaults="Are you sure you want to revoke {name}? This will immediately disable the key."
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
                  revokeApiKey
                    .mutateAsync({
                      id: apiKeyId,
                    })
                    .then(() => {
                      utils.apiKeys.list.invalidate();
                    }),
                  {
                    loading: t("revokeApiKeyLoading", {
                      defaultValue: "Revoking API key...",
                    }),
                    success: t("revokeApiKeySuccess", {
                      defaultValue: "API key revoked successfully",
                    }),
                    error: t("revokeApiKeyError", {
                      defaultValue: "Failed to revoke API key",
                    }),
                  },
                );
                revokeDialog.dismiss();
              }}
            >
              <Trans i18nKey="revoke" defaults="Revoke" />
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
