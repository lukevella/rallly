import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { PollFolders } from "@/app/[locale]/(admin)/polls/[[...list]]/polls-folders";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

interface PageParams extends Params {
  list?: string;
}

export default async function Layout({
  children,
  params,
}: {
  children?: React.ReactNode;
  params: PageParams;
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-2.5">
          <PageTitle>{t("polls")}</PageTitle>
          <Button size="sm" asChild>
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
            </Link>
          </Button>
        </div>
      </PageHeader>
      <PageContent className="space-y-3 lg:space-y-4">
        <PollFolders />
        {children}
      </PageContent>
    </PageContainer>
  );
}
