"use client";

import { Icon } from "@rallly/ui/icon";
import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import { Trans } from "react-i18next";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/app/components/responsive-menu";
import { IfCloudHosted } from "@/contexts/environment";

export function SettingsMenu() {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuItem href="/settings/profile">
        <Icon>
          <UserIcon />
        </Icon>
        <Trans i18nKey="profile" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/settings/preferences">
        <Icon>
          <Settings2Icon />
        </Icon>
        <Trans i18nKey="preferences" />
      </ResponsiveMenuItem>
      <IfCloudHosted>
        <ResponsiveMenuItem href="/settings/billing">
          <Icon>
            <CreditCardIcon />
          </Icon>
          <Trans i18nKey="billing" />
        </ResponsiveMenuItem>
      </IfCloudHosted>
    </ResponsiveMenu>
  );
}
