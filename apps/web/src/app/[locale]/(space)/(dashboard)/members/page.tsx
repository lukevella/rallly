import type { Metadata } from "next";
import {
  ListView,
  ListViewColumn,
  ListViewContent,
  ListViewHeader,
  ListViewPageTitle,
} from "@/components/list-view";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { MembersPageContent, MembersPageToolbar } from "./members-page";

// No Suspense boundaries here: the data loads under the dashboard's
// loading.tsx, so the page appears once instead of skeleton after skeleton.
export default function Page() {
  return (
    <ListView>
      <ListViewHeader>
        <ListViewColumn>
          <ListViewPageTitle>
            <Trans i18nKey="members" defaults="Members" />
          </ListViewPageTitle>
          <MembersPageToolbar />
        </ListViewColumn>
      </ListViewHeader>
      <ListViewContent className="pt-2">
        <ListViewColumn className="pb-8">
          <MembersPageContent />
        </ListViewColumn>
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
