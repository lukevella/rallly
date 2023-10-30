import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";

export default function Page() {
  return <CreatePoll />;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
