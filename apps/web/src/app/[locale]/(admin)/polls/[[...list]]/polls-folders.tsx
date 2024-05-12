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
        <Trans i18nKey="pollsListAll" defaults="All" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/mine">
        <Trans i18nKey="pollsListMine" defaults="Mine" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/other">
        <Trans i18nKey="pollsListOther" defaults="Other" />
      </ResponsiveMenuItem>
    </ResponsiveMenu>
  );
}
