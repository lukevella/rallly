import { PollsList } from "@/app/[locale]/(admin)/polls/[[...list]]/polls-list";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

interface PageParams extends Params {
  list?: string;
}

export default async function Page({ params }: { params: PageParams }) {
  const list = params.list ? params.list[0] : "all";
  return <PollsList list={list} />;
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
