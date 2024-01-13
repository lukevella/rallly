import { getTranslation } from "@/app/i18n";

import { PollsList } from "./polls-list";

export default async function Page() {
  return <PollsList />;
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
