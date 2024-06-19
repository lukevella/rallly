"use client";

import { Icon } from "@rallly/ui/icon";
import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import { Trans } from "react-i18next";

import { TabMenu, TabMenuItem } from "@/app/components/tab-menu";
import { IfCloudHosted } from "@/contexts/environment";

export function SettingsMenu() {
  return (
    <TabMenu>
      <TabMenuItem href="/settings/profile">
        <Icon>
          <UserIcon />
        </Icon>
        <Trans i18nKey="profile" />
      </TabMenuItem>
      <TabMenuItem href="/settings/preferences">
        <Icon>
          <Settings2Icon />
        </Icon>
        <Trans i18nKey="preferences" />
      </TabMenuItem>
      <IfCloudHosted>
        <TabMenuItem href="/settings/billing">
          <Icon>
            <CreditCardIcon />
          </Icon>
          <Trans i18nKey="billing" />
        </TabMenuItem>
      </IfCloudHosted>
    </TabMenu>
  );
}
