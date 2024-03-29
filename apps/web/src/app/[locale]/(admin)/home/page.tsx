import { Button } from "@rallly/ui/button";
import { Card, CardContent } from "@rallly/ui/card";
import { Input } from "@rallly/ui/input";
import { HomeIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

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

import { ResponseList } from "./table";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <PageIcon>
            <HomeIcon />
          </PageIcon>
          <Trans t={t} i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-6">
        <Input className="w-full rounded-full" />
        <Card>
          <CardContent>
            <CurrentUserAvatar />
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-6">
          <Button>Create Group Poll</Button>
          {/* <Button>Create 1:1</Button>
          <Button>Create Booking Page</Button> */}
        </div>
        <hr />
        <ResponseList />
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
    title: t("invites"),
  };
}
