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
import { useTransition } from "react";
import { Trans } from "@/components/trans";
import { useSafeAction } from "@/lib/safe-action/client";
import { removeInstanceLicenseAction } from "../actions";

export function RemoveLicenseButton() {
  const [isPending, startTransition] = useTransition();
  const dialog = useDialog();
  const removeInstanceLicense = useSafeAction(removeInstanceLicenseAction);
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
            loading={isPending}
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                await removeInstanceLicense.executeAsync();
                dialog.dismiss();
              })
            }
          >
            <Trans i18nKey="removeLicense" defaults="Remove License" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
