import { Tile, TileGrid, TileIcon, TileTitle } from "@rallly/ui/tile";
import {
  BarChart2Icon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
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
        <div className="flex items-center gap-x-3">
          <PageTitle>
            <Trans i18nKey="home" defaults="Home" />
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent className="space-y-6">
        <TileGrid>
          <Tile href="/polls">
            <TileIcon>
              <BarChart2Icon />
            </TileIcon>
            <TileTitle>
              <Trans i18nKey="polls" defaults="Polls" />
            </TileTitle>
          </Tile>

          <Tile href="/events">
            <TileIcon>
              <CalendarIcon />
            </TileIcon>
            <TileTitle>
              <Trans i18nKey="events" defaults="Events" />
            </TileTitle>
          </Tile>

          <Tile href="/settings/profile">
            <TileIcon>
              <UserIcon />
            </TileIcon>
            <TileTitle>
              <Trans i18nKey="profile" defaults="Profile" />
            </TileTitle>
          </Tile>

          <Tile href="/settings/preferences">
            <TileIcon>
              <SettingsIcon />
            </TileIcon>
            <TileTitle>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </TileTitle>
          </Tile>

          <Tile href="/settings/billing">
            <TileIcon>
              <CreditCardIcon />
            </TileIcon>
            <TileTitle>
              <Trans i18nKey="billing" defaults="Billing" />
            </TileTitle>
          </Tile>
        </TileGrid>
      </PageContent>
    </PageContainer>
  );
}
