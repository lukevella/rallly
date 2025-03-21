import { Icon } from "@rallly/ui/icon";
import { DotIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";

import { PricingTable } from "./pricing-table";
import { ProBadge } from "./pro-badge";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader className="text-center">
        <div className="p-2">
          <ProBadge />
        </div>
        <PageTitle className="mt-2">
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </PageTitle>
        <p className="text-muted-foreground mt-4 text-center text-sm leading-relaxed">
          <Trans
            i18nKey="upgradeOverlaySubtitle3"
            defaults="Unlock these features by upgrading to a Pro plan."
          />
        </p>
      </PageHeader>
      <PageContent>
        <PricingTable />
        <div className="mt-8 flex flex-col flex-wrap items-center gap-1 sm:flex sm:flex-row sm:justify-center">
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="pricesShownIn"
              defaults="Prices shown in {currency}"
              values={{
                currency: "USD",
              }}
            />
          </p>
          <Icon>
            <DotIcon className="hidden sm:block" />
          </Icon>
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="cancelAnytime"
              defaults="Cancel anytime from your <a>billing page</a>."
              components={{
                a: <Link className="text-link" href="/settings/billing" />,
              }}
            />
          </p>
        </div>
      </PageContent>
    </PageContainer>
  );
}
