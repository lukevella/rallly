import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  PageContainer,
  PageContent,
  PageHeader,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <Button asChild>
          <Link href="/polls">
            <Icon>
              <ArrowLeftIcon />
            </Icon>
            <Trans t={t} i18nKey="back" defaults="Back" />
          </Link>
        </Button>
      </PageHeader>
      <PageContent className="max-w-4xl">
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
