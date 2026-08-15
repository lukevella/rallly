"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { UserPlusIcon } from "lucide-react";
import { Trans, useTranslation } from "@/i18n/client";
import { InviteMemberDialog } from "./invite-member-dialog";

export function InviteMemberButton({
  disabled,
  canCreateInvite,
}: {
  disabled?: boolean;
  canCreateInvite: boolean;
}) {
  const { t } = useTranslation();
  const inviteMemberDialog = useDialog();
  return (
    <>
      <Button
        variant="primary"
        disabled={disabled}
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
        <Icon>
          <UserPlusIcon />
        </Icon>
        <Trans i18nKey="inviteMember" defaults="Invite member" />
      </Button>
      <InviteMemberDialog {...inviteMemberDialog.dialogProps} />
    </>
  );
}
