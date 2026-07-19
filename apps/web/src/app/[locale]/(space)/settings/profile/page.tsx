import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import type { Params } from "@/app/[locale]/types";
import {
  AccountDeletionSummary,
  AccountDeletionSummarySkeleton,
} from "@/features/account-deletion/components/account-deletion-summary";
import { PendingDeletionNotice } from "@/features/account-deletion/components/pending-deletion-notice";
import { getCurrentUser } from "@/features/user/data";
import { getTranslation } from "@/i18n/server";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { DeleteAccountButton } from "./delete-account-button";
import { ProfilePage } from "./profile-page";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  return (
    <ProfilePage
      name={user.name}
      image={user.image}
      email={user.email}
      dangerZone={
        user.deletedAt ? (
          <PendingDeletionNotice deletedAt={user.deletedAt} />
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
