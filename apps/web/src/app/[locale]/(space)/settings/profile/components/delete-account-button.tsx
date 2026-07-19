"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";

import { Trans } from "@/i18n/client";
import { DeleteAccountDialog } from "./delete-account-dialog";

export function DeleteAccountButton({
  summary,
}: {
  summary?: React.ReactNode;
}) {
  const dialog = useDialog();
  return (
    <>
      <Button className="text-destructive" {...dialog.triggerProps}>
        <Trans i18nKey="deleteAccount" defaults="Delete Account" />
      </Button>
      <DeleteAccountDialog {...dialog.dialogProps} summary={summary} />
    </>
  );
}
