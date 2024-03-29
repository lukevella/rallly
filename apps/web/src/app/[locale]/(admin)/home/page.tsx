import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardFooter } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { BarChart2Icon, HomeIcon, PlusIcon } from "lucide-react";
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
      <PageContent className="space-y-6">
        <Input className="w-full rounded-full" />
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <CurrentUserAvatar />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Icon size="lg">
                <BarChart2Icon />
              </Icon>
              <div className="text-muted-foreground mb-2 mt-2 text-sm font-semibold">
                Polls
              </div>
              <div className="text-xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-muted-foreground text-sm font-semibold">
                Responses
              </div>
              <div className="font-bold">0</div>
            </CardContent>
          </Card>
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
