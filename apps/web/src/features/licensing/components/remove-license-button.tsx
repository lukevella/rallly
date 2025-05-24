"use client";

import { Trans } from "@/components/trans";
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
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeInstanceLicense } from "../mutations";

export function RemoveLicenseButton({
  licenseId,
}: {
  licenseId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dialog = useDialog();
  return (
    <Dialog {...dialog.dialogProps}>
      <DialogTrigger asChild>
        <Button onClick={() => dialog.trigger()}>
          <Icon>
            <XIcon />
          </Icon>
          <Trans i18nKey="removeLicense" defaults="Remove License" />
        </Button>
      </DialogTrigger>
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
                await removeInstanceLicense({
                  licenseId,
                });
                router.refresh();
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
