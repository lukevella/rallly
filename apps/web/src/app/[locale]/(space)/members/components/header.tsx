"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { UserPlusIcon } from "lucide-react";
import { InviteMemberDialog } from "@/app/[locale]/(space)/members/components/invite-member-dialog";
import {
  PageHeader,
  PageHeaderActions,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
import { PayWallDialog } from "@/components/pay-wall-dialog";
import { Trans } from "@/components/trans";
import { useSpace } from "@/features/spaces/client";
import { useTranslation } from "@/i18n/client";
import { useAbility } from "@/lib/ability-manager/client";

export function MembersHeader() {
  const { t } = useTranslation();
  const inviteMemberDialog = useDialog();
  const payWallDialog = useDialog();
  const { ability } = useAbility();
  const space = useSpace();
  return (
    <>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="members" defaults="Members" />
        </PageTitle>
        <PageHeaderActions>
          <SearchInput
            placeholder={t("searchMembers", { defaultValue: "Search members" })}
          />
          <Button
            variant="primary"
            onClick={() => {
              if (ability.cannot("create", "SpaceMemberInvite")) {
                toast.error(
                  t("adminRoleRequired", {
                    defaultValue:
                      "You need to be an admin to perform this action",
                  }),
                );
              } else if (space.ability.cannot("invite", "Member")) {
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
        </PageHeaderActions>
      </PageHeader>
      <PayWallDialog {...payWallDialog.dialogProps} />
      <InviteMemberDialog {...inviteMemberDialog.dialogProps} />
    </>
  );
}
