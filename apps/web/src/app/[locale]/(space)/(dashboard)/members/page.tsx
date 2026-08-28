import { Skeleton } from "@rallly/ui/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/page-layout";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { SharingSection } from "./components/sharing-section";
import { MembersPageActions, MembersPageContent } from "./members-page";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="members" defaults="Members" />
          </PageTitle>
        </PageHeaderContent>
        <Suspense>
          <MembersPageActions />
        </Suspense>
      </PageHeader>
      <PageContent className="space-y-4">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-1/2" />
            </div>
          }
        >
          <MembersPageContent />
        </Suspense>
        <SharingSection />
      </PageContent>
    </PageContainer>
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
