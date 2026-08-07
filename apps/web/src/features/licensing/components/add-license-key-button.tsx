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

  // On success the page swaps to the installed-license view, which unmounts
  // this trigger, so dismiss()'s focus restore targets a detached node and
  // focus falls to <body>. Send it to the main content region instead, which
  // survives the swap. Deferred so it lands after the dialog's own focus
  // handling rather than being overwritten by it.
  const handleSuccess = () => {
    dialog.dismiss();
    requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
    });
  };

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
          <LicenseKeyForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
