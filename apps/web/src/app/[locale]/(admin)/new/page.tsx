import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex justify-between items-center gap-x-4">
          <PageTitle>
            <Trans t={t} i18nKey="polls" />
          </PageTitle>
          <Button asChild>
            <Link href="/polls">
              <Trans t={t} i18nKey="cancel" defaults="Cancel" />
            </Link>
          </Button>
        </div>
      </PageHeader>
      <PageContent>
        <CreatePoll />
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
    title: t("newPoll"),
  };
}
