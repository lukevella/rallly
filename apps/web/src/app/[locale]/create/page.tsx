import { CreateForm } from "@/app/[locale]/create/create-form";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: { locale: string } }) {
  return <CreateForm />;
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
