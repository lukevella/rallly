"use client";

import { TabMenu, TabMenuItem } from "@/app/components/tab-menu";
import { Trans } from "@/components/trans";

export function PollFolders() {
  return (
    <TabMenu>
      <TabMenuItem href="/polls">
        <Trans i18nKey="pollsListAll" defaults="All" />
      </TabMenuItem>
      <TabMenuItem href="/polls/mine">
        <Trans i18nKey="pollsListMine" defaults="Mine" />
      </TabMenuItem>
      <TabMenuItem href="/polls/other">
        <Trans i18nKey="pollsListOther" defaults="Other" />
      </TabMenuItem>
    </TabMenu>
  );
}
