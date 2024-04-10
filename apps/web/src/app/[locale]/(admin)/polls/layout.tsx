import { PollFolders } from "@/app/[locale]/(admin)/polls/[[...list]]/polls-folders";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

interface PageParams extends Params {
  list?: string;
}

export default async function Layout({
  children,
  params,
}: {
  children?: React.ReactNode;
  params: PageParams;
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{t("polls")}</PageTitle>
      </PageHeader>
      <PageContent className="space-y-4">
        <PollFolders />
        <div>{children}</div>
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
