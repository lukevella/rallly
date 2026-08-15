"use client";

import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { MailIcon } from "lucide-react";
import React from "react";
import type { MemberInviteDTO } from "@/features/space/member/types";
import { Trans } from "@/i18n/client";
import { PendingInvitesDialog } from "./pending-invites-dialog";

export function PendingInvites({
  invites,
  canCancelInvite,
}: {
  invites: MemberInviteDTO[];
  canCancelInvite: boolean;
}) {
  const pendingInvitesDialog = useDialog();
  const { dismiss: dismissPendingInvitesDialog } = pendingInvitesDialog;

  React.useEffect(() => {
    if (invites.length === 0) {
      dismissPendingInvitesDialog();
    }
  }, [invites.length, dismissPendingInvitesDialog]);

  return (
    <>
      {invites.length > 0 ? (
        <Alert variant="primary">
          <MailIcon />
          <AlertDescription>
            <Trans
              i18nKey="pendingInvitesAlertDescription"
              defaults="{count, plural, one {There is # pending invite} other {There are # pending invites}}"
              values={{ count: invites.length }}
            />
          </AlertDescription>
          <AlertAction>
            <Button
              size="sm"
              onClick={() => {
                pendingInvitesDialog.trigger();
              }}
            >
              <Trans i18nKey="viewInvites" defaults="View invites" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      <PendingInvitesDialog
        invites={invites}
        canCancelInvite={canCancelInvite}
        {...pendingInvitesDialog.dialogProps}
      />
    </>
  );
}
