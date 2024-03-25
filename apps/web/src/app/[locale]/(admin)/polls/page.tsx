import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { SquarePenIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { PollsList } from "@/app/[locale]/(admin)/polls/polls-list";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
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
      <PageHeader>
        <Flex justify="between">
          <Flex gap="sm" align="center">
            <Icon size="lg">
              <UsersIcon />
            </Icon>
            <PageTitle>
              <Trans t={t} i18nKey="polls" defaults="Polls" />
            </PageTitle>
          </Flex>
        </Flex>
      </PageHeader>
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
