import { BarChart2Icon } from "lucide-react";

import { PendingEventsTable } from "@/app/[locale]/(admin)/pages/pending-events-table";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({
  params,
}: {
  params: Params;
  children?: React.ReactNode;
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-3">
          <PageIcon>
            <BarChart2Icon />
          </PageIcon>
          <PageTitle>
            {t("polls", {
              defaultValue: "Polls",
            })}
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent>
        <PendingEventsTable />
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
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
