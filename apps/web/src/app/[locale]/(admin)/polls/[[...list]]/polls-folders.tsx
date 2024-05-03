"use client";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/app/components/responsive-menu";
import { Trans } from "@/components/trans";

export function PollFolders() {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuItem href="/polls">
        <Trans i18nKey="pollsListAll" defaults="All Polls" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/created">
        <Trans i18nKey="pollsListMine" defaults="My Polls" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/other">
        <Trans i18nKey="pollsListOther" defaults="Other Polls" />
      </ResponsiveMenuItem>
    </ResponsiveMenu>
  );
}
