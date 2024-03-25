import { Params } from "@/app/[locale]/types";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

import { ResponseList } from "./table";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageContent>
        <ResponseList />
      </PageContent>
    </PageContainer>
  );
}
