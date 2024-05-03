import { Card, CardContent } from "@rallly/ui/card";

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
      <PageContent className="space-y-3 lg:space-y-4">
        <PollFolders />
        <Card>{children}</Card>
      </PageContent>
    </PageContainer>
  );
}
