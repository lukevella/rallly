import { UserScheduledEvents } from "@/app/[locale]/(admin)/events/user-scheduled-events";
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
        <div className="flex items-center gap-x-3">
          <PageTitle>
            {t("events", {
              defaultValue: "Events",
            })}
          </PageTitle>
        </div>
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
