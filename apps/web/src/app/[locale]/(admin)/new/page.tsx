import { Button } from "@rallly/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { PageContainer, PageContent, PageHeader } from "@/app/components/page";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <Button asChild variant="ghost">
          <Link href="/polls">
            <ArrowLeftIcon className="w-4 h-4" />
            <Trans t={t} i18nKey="back" />
          </Link>
        </Button>
      </PageHeader>
      <PageContent>
        <CreatePoll />
      </PageContent>
    </PageContainer>
  );
}
