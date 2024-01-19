import { Button } from "@rallly/ui/button";
import { PenBoxIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Layout({
  params,
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between gap-x-4">
          <PageTitle>
            <Trans t={t} i18nKey="polls" />
          </PageTitle>
          <Button asChild>
            <Link href="/new">
              <PenBoxIcon className="text-muted-foreground size-4" />
              <span className="hidden sm:inline">
                <Trans t={t} i18nKey="newPoll" />
              </span>
            </Link>
          </Button>
        </div>
      </PageHeader>
      <PageContent>{children}</PageContent>
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
