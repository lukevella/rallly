import { Button } from "@rallly/ui/button";
import { PlusIcon, VoteIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/app/i18n";
import { Container } from "@/components/container";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";

import { PollsPage } from "./polls-page";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <TopBar className="flex items-center justify-between gap-4">
        <TopBarTitle title={<Trans t={t} i18nKey="polls" />} icon={VoteIcon} />
        <div>
          <Button variant="primary" asChild={true}>
            <Link href="/new">
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              <Trans t={t} defaults="New Poll" i18nKey="newPoll" />
            </Link>
          </Button>
        </div>
      </TopBar>
      <div>
        <Container className="mx-auto p-3 sm:p-8">
          <PollsPage />
        </Container>
      </div>
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
    title: t("polls"),
  };
}
