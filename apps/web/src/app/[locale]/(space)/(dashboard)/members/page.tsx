import { Skeleton } from "@rallly/ui/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
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

export default function Page() {
  return (
    <ListView>
      <ListViewHeader>
        <ListViewTitleBar>
          <ListViewTitle>
            <Trans i18nKey="members" defaults="Members" />
          </ListViewTitle>
          <Suspense>
            <MembersPageActions />
          </Suspense>
        </ListViewTitleBar>
      </ListViewHeader>
      <ListViewContent className="pt-2">
        <Suspense
          fallback={
            <div aria-hidden className="py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                  key={i}
                  className="flex h-12 items-center gap-3 px-8"
                >
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          }
        >
          <MembersPageContent />
        </Suspense>
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
