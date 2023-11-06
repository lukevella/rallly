import { ProfilePage } from "@/app/[locale]/(admin)/settings/profile/profile-page";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

export default function Page() {
  return <ProfilePage />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
