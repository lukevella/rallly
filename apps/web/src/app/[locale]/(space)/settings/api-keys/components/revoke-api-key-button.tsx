"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
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
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { BanIcon, MoreVerticalIcon } from "lucide-react";
import { revokeApiKeyAction } from "@/features/api-keys/actions";
import { Trans, useTranslation } from "@/i18n/client";

export function RevokeApiKeyButton({
  apiKeyId,
  apiKeyName,
}: {
  apiKeyId: string;
  apiKeyName: string;
}) {
  const { t } = useTranslation();
  const revokeDialog = useDialog();
  const revokeApiKey = useMutation(
    mutationOptions(revokeApiKeyAction, {
      onSuccess: () => {
        toast.success(t("revoked", { defaultValue: "Revoked" }));
      },
      onSettled: () => {
        revokeDialog.dismiss();
      },
    }),
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("moreOptions", { defaultValue: "More options" })}
              variant="ghost"
              size="icon"
            />
          }
        >
          <MoreVerticalIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              revokeDialog.trigger();
            }}
            variant="destructive"
          >
            <BanIcon />
            <Trans i18nKey="revoke" defaults="Revoke" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...revokeDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="revoke" defaults="Revoke" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="revokeConfirmation"
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
              loading={revokeApiKey.isPending}
              onClick={() => {
                revokeApiKey.mutate({ id: apiKeyId });
              }}
            >
              <Trans i18nKey="revoke" defaults="Revoke" />
            </Button>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
