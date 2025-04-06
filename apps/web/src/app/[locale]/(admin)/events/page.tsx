import { UserScheduledEvents } from "@/app/[locale]/(admin)/events/user-scheduled-events";
import type { Params } from "@/app/[locale]/types";
import { EventPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: Params }) {
  await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex flex-col gap-3">
          <EventPageIcon />
          <PageTitle>
            <Trans i18nKey="events" defaults="Events" />
          </PageTitle>
        </div>
        <PageDescription>
          <Trans
            i18nKey="eventsPageDesc"
            defaults="View and manage your scheduled events"
          />
        </PageDescription>
      </PageHeader>
      <PageContent>
        <UserScheduledEvents />
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
    title: t("events", {
      defaultValue: "Events",
    }),
  };
}
