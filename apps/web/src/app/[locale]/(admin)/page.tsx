import { Button } from "@rallly/ui/button";
import { Card, CardContent } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { HomeIcon, InfinityIcon, PlusIcon, SlashIcon } from "lucide-react";
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
import Dashboard from "@/app/[locale]/(admin)/dashboard";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import { CurrentUserAvatar } from "@/components/user";
import { Plan } from "@/contexts/plan";

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
          <Dashboard />
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
