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
  DialogTrigger,
  useDialog,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function RemoveLicenseButton() {
  const router = useRouter();
  const dialog = useDialog();
  const removeInstanceLicense = trpc.licensing.remove.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });
  return (
    <Dialog {...dialog.dialogProps}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" onClick={() => dialog.trigger()}>
              <Icon>
                <XIcon />
              </Icon>
              <span className="sr-only">
                <Trans i18nKey="removeLicense" defaults="Remove License" />
              </span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <Trans i18nKey="removeLicense" defaults="Remove License" />
        </TooltipContent>
      </Tooltip>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="removeLicense" defaults="Remove License" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="removeLicenseDescription"
              defaults="Are you sure you want to remove this license?"
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
          </DialogClose>
          <Button
            loading={removeInstanceLicense.isPending}
            variant="destructive"
            onClick={async () => {
              await removeInstanceLicense.mutateAsync();
              dialog.dismiss();
            }}
          >
            <Trans i18nKey="removeLicense" defaults="Remove License" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
