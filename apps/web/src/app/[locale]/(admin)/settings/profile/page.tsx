import type { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";

import { ProfilePage } from "./profile-page";

export default async function Page() {
  return <ProfilePage />;
}

export async function generateMetadata(props: { params: Promise<Params> }) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
