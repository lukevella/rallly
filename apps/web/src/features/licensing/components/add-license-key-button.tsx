"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { PlusIcon } from "lucide-react";
import { LicenseKeyForm } from "@/features/licensing/components/license-key-form";
import { Trans } from "@/i18n/client";

export function AddLicenseKeyButton() {
  const dialog = useDialog();

  return (
    <>
      <Button variant="primary" {...dialog.triggerProps}>
        <PlusIcon data-icon="inline-start" />
        <Trans i18nKey="addLicenseKey" defaults="Add license key" />
      </Button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="addLicenseKey" defaults="Add license key" />
            </DialogTitle>
          </DialogHeader>
          <LicenseKeyForm onSuccess={dialog.dismiss} />
        </DialogContent>
      </Dialog>
    </>
  );
}
