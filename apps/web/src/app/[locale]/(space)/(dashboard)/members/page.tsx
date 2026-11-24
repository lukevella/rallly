import type { Metadata } from "next";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitle,
} from "@/components/page";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { MembersPageContent, MembersPageToolbar } from "./members-page";

// No Suspense boundaries here: the data loads under the dashboard's
// loading.tsx, so the page appears once instead of skeleton after skeleton.
export default function Page() {
  return (
    <PageShell>
      <PageHeader>
        <PageColumn>
          <PageTitle>
            <Trans i18nKey="members" defaults="Members" />
          </PageTitle>
          <MembersPageToolbar />
        </PageColumn>
      </PageHeader>
      <PageContent className="pt-2">
        <PageColumn className="pb-8">
          <MembersPageContent />
        </PageColumn>
      </PageContent>
    </PageShell>
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
