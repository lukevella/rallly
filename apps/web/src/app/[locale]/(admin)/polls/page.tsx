import { getTranslation } from "@/app/i18n";

import { PollsPage } from "./polls-page";

export default function Page() {
  return <PollsPage />;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("polls"),
  };
}
