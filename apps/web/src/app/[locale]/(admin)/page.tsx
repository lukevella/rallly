import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { HomeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardIcon,
  AppCardName,
  GroupPollIcon,
} from "@/app/[locale]/(admin)/app-card";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <PageContainer>
        <PageHeader>
          <div className="flex items-center gap-x-3">
            <PageIcon>
              <HomeIcon />
            </PageIcon>
            <PageTitle>
              <Trans t={t} i18nKey="home" defaults="Home" />
            </PageTitle>
          </div>
        </PageHeader>
        <PageContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <AppCard>
              <AppCardIcon>
                <GroupPollIcon size="lg" />
              </AppCardIcon>
              <AppCardContent>
                <div>
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
                </div>
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
            <AppCard>
              <AppCardIcon>
                <GroupPollIcon size="lg" />
              </AppCardIcon>
              <AppCardContent>
                <div>
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
                </div>
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
    </div>
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
