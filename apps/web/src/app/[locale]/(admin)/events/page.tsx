import { EventPeriodFilter } from "@/app/[locale]/(admin)/events/event-period-filter";
import { UpcomingEvents } from "@/app/[locale]/(admin)/events/upcoming-events";
import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between gap-x-4">
          <PageTitle>
            {t("events", {
              defaultValue: "Events",
            })}
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent>
        <EventPeriodFilter />
        <UpcomingEvents />
      </PageContent>
    </PageContainer>
  );
}
