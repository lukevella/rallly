import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

import { ProfilePage } from "./profile-page";

export default async function Page() {
  return <ProfilePage />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
