"use client";

import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import { Trans } from "react-i18next";

import { TabMenu, TabMenuItem } from "@/app/components/tab-menu";
import { IfCloudHosted } from "@/contexts/environment";

export function SettingsMenu() {
  return (
    <TabMenu>
      <TabMenuItem href="/settings/profile">
        <UserIcon className="size-4" />
        <Trans i18nKey="profile" />
      </TabMenuItem>
      <TabMenuItem href="/settings/preferences">
        <Settings2Icon className="size-4" />
        <Trans i18nKey="preferences" />
      </TabMenuItem>
      <IfCloudHosted>
        <TabMenuItem href="/settings/billing">
          <CreditCardIcon className="size-4" />
          <Trans i18nKey="billing" />
        </TabMenuItem>
      </IfCloudHosted>
    </TabMenu>
  );
}
