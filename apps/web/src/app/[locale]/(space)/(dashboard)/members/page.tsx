import type { Metadata } from "next";
import {
  ListView,
  ListViewContent,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
} from "@/components/list-view";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { MembersPageActions, MembersPageContent } from "./members-page";

// No Suspense boundaries here: the data loads under the dashboard's
// loading.tsx, so the page appears once instead of skeleton after skeleton.
export default function Page() {
  return (
    <ListView>
      <ListViewHeader>
        <ListViewTitleBar>
          <ListViewTitle>
            <Trans i18nKey="members" defaults="Members" />
          </ListViewTitle>
          <MembersPageActions />
        </ListViewTitleBar>
      </ListViewHeader>
      <ListViewContent className="pt-2">
        <MembersPageContent />
      </ListViewContent>
    </ListView>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("members", {
      defaultValue: "Members",
    }),
    description: t("membersSettingsDescription", {
      defaultValue:
        "Manage space members, invite new users, and control access permissions.",
    }),
  };
}
