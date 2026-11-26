"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { Trans, useTranslation } from "@/i18n/client";
import { InviteMemberDialog } from "./invite-member-dialog";

export function InviteMemberButton({
  availableSeats,
  canManageBilling,
  canCreateInvite,
}: {
  availableSeats: number;
  canManageBilling: boolean;
  canCreateInvite: boolean;
}) {
  const { t } = useTranslation();
  const inviteMemberDialog = useDialog();
  return (
    <>
      <Button
        onClick={() => {
          if (!canCreateInvite) {
            toast.error(
              t("adminRoleRequired", {
                defaultValue: "You need to be an admin to perform this action",
              }),
            );
          } else {
            inviteMemberDialog.trigger();
          }
        }}
      >
        <Trans i18nKey="addMember" defaults="Add member" />
      </Button>
      <InviteMemberDialog
        {...inviteMemberDialog.dialogProps}
        availableSeats={availableSeats}
        canManageBilling={canManageBilling}
      />
    </>
  );
}
