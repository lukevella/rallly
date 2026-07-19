import type { Metadata } from "next";
import { Suspense } from "react";

import type { Params } from "@/app/[locale]/types";
import {
  AccountDeletionSummary,
  AccountDeletionSummarySkeleton,
} from "@/features/account-deletion/components/account-deletion-summary";
import { getTranslation } from "@/i18n/server";
import { ProfilePage } from "./profile-page";

export default function Page() {
  return (
    <ProfilePage
      deletionSummary={
        <Suspense fallback={<AccountDeletionSummarySkeleton />}>
          <AccountDeletionSummary />
        </Suspense>
      }
    />
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
