import type { Metadata } from "next";
import { Suspense } from "react";

import type { Params } from "@/app/[locale]/types";
import {
  AccountDeletionSummary,
  AccountDeletionSummarySkeleton,
} from "@/features/account-deletion/components/account-deletion-summary";
import { PendingDeletionNotice } from "@/features/account-deletion/components/pending-deletion-notice";
import { getPendingDeletion } from "@/features/account-deletion/data";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { DeleteAccountButton } from "./delete-account-button";
import { ProfilePage } from "./profile-page";

export default async function Page() {
  const user = await requireUser();
  const deletedAt = await getPendingDeletion(user.id);

  return (
    <ProfilePage
      dangerZone={
        deletedAt ? (
          <PendingDeletionNotice deletedAt={deletedAt} />
        ) : (
          <DeleteAccountButton
            summary={
              <Suspense fallback={<AccountDeletionSummarySkeleton />}>
                <AccountDeletionSummary />
              </Suspense>
            }
          />
        )
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
