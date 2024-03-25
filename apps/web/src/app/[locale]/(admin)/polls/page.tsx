import { PollsList } from "@/app/[locale]/(admin)/polls/polls-list";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageContent>
        <PollsList />
      </PageContent>
    </PageContainer>
  );
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
