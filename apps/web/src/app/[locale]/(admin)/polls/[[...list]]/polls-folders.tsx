"use client";

import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon, ListIcon, VoteIcon } from "lucide-react";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/app/components/responsive-menu";
import { Trans } from "@/components/trans";

export function PollFolders() {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuItem href="/polls">
        <Icon>
          <ListIcon />
        </Icon>
        <Trans i18nKey="pollsListAll" defaults="All Polls" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/created">
        <Icon>
          <BarChart2Icon />
        </Icon>
        <Trans i18nKey="pollsListMine" defaults="My Polls" />
      </ResponsiveMenuItem>
      <ResponsiveMenuItem href="/polls/other">
        <Icon>
          <VoteIcon />
        </Icon>
        <Trans i18nKey="pollsListOther" defaults="Other Polls" />
      </ResponsiveMenuItem>
    </ResponsiveMenu>
  );
}
