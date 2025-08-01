"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { UserPlusIcon } from "lucide-react";
import { PayWallDialog } from "@/components/pay-wall-dialog";
import { Trans } from "@/components/trans";
import { useSpace } from "@/features/space/client";
import { useTranslation } from "@/i18n/client";
import { InviteMemberDialog } from "./invite-member-dialog";

export function InviteMemberButton() {
  const { t } = useTranslation();
  const inviteMemberDialog = useDialog();
  const payWallDialog = useDialog();
  const space = useSpace();
  return (
    <>
      <Button
        onClick={() => {
          if (space.getMemberAbility().cannot("create", "SpaceMemberInvite")) {
            toast.error(
              t("adminRoleRequired", {
                defaultValue: "You need to be an admin to perform this action",
              }),
            );
          } else if (space.getAbility().cannot("invite", "Member")) {
            payWallDialog.trigger();
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
      <PayWallDialog {...payWallDialog.dialogProps} />
      <InviteMemberDialog {...inviteMemberDialog.dialogProps} />
    </>
  );
}
