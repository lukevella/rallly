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
        <PageTitle>
          <EventPageIcon />
          <Trans i18nKey="events" defaults="Events" />
        </PageTitle>
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
