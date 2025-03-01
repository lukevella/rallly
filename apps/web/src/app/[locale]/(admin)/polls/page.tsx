import { BarChart2Icon } from "lucide-react";

import { UserPolls } from "@/app/[locale]/(admin)/polls/user-polls";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";

export default async function Page(
  props: {
    params: Promise<Params>;
    children?: React.ReactNode;
  }
) {
  const params = await props.params;
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
        <UserPolls />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
