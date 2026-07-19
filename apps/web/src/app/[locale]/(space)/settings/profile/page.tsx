import type { Metadata } from "next";

import type { Params } from "@/app/[locale]/types";
import { getAccountDeletionSummary } from "@/features/user/data";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { ProfilePage } from "./profile-page";

export default async function Page() {
  const user = await requireUser();
  const { pollCount, eventCount, hasActiveSubscription } =
    await getAccountDeletionSummary(user.id);

  return (
    <ProfilePage
      pollCount={pollCount}
      eventCount={eventCount}
      hasActiveSubscription={hasActiveSubscription}
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
