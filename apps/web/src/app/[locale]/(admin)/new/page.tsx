import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon, BarChart2Icon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="gap-lg flex justify-between">
          <Flex>
            <Button size="sm" asChild>
              <Link href="/polls">
                <Icon>
                  <ArrowLeftIcon />
                </Icon>
              </Link>
            </Button>
            <PageTitle>
              <PageIcon>
                <BarChart2Icon />
              </PageIcon>
              <Trans t={t} i18nKey="polls" defaults="polls" />
            </PageTitle>
            <Icon>
              <ChevronRightIcon />
            </Icon>
            <PageTitle>
              <Trans t={t} i18nKey="new" defaults="New" />
            </PageTitle>
          </Flex>
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
