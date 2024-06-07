import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { BarChart2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardIcon,
  AppCardName,
} from "@/app/[locale]/(admin)/app-card";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { SquircleClipPath } from "@/app/components/squircle";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans t={t} i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <div className="flex flex-wrap gap-4">
          <SquircleClipPath />
          <AppCard>
            <AppCardContent>
              <AppCardIcon>
                <BarChart2Icon className="size-6" />
              </AppCardIcon>
              <AppCardName>
                <Trans t={t} i18nKey="groupPoll" defaults="Group Poll" />
              </AppCardName>
              <AppCardDescription>
                <Trans
                  t={t}
                  i18nKey="groupPollDescription"
                  defaults="Share your availability with a group of people and find the best time to meet."
                />
              </AppCardDescription>
            </AppCardContent>
            <AppCardFooter>
              <Button asChild>
                <Link href="/new">
                  <Icon>
                    <PlusIcon />
                  </Icon>
                  <Trans t={t} i18nKey="create" defaults="Create" />
                </Link>
              </Button>
            </AppCardFooter>
          </AppCard>
        </div>
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
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
