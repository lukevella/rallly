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
        <div className="flex items-center gap-x-3">
          <PageTitle>
            {t("groupPolls", {
              defaultValue: "Group Polls",
            })}
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-3 lg:space-y-4">
        <PollFolders />
        {children}
      </PageContent>
    </PageContainer>
  );
}
