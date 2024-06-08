import { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/app/components/responsive-menu";
import { getTranslation } from "@/app/i18n";

export default async function Layout({
  params,
  children,
}: {
  params: Params;
  children?: React.ReactNode;
}) {
  const { t } = await getTranslation(params.locale);
  return (
    <div className="flex items-start">
      <div className="grow">
        <PageContainer>
          <PageHeader>
            <div className="flex items-center justify-between gap-x-4">
              <PageTitle>
                {t("events", {
                  defaultValue: "Events",
                })}
              </PageTitle>
              <ResponsiveMenu>
                <ResponsiveMenuItem href="/events">Upcoming</ResponsiveMenuItem>
                <ResponsiveMenuItem href="/events/pending">
                  Pending
                </ResponsiveMenuItem>
                <ResponsiveMenuItem href="/events/past">
                  Past
                </ResponsiveMenuItem>
              </ResponsiveMenu>
            </div>
          </PageHeader>
          <PageContent>{children}</PageContent>
        </PageContainer>
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
    title: t("events"),
  };
}
