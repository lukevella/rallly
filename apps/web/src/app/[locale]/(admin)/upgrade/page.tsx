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
        <ProBadge />
        <PageTitle className="mt-6">
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </PageTitle>
        <p className="text-muted-foreground mt-4 text-center text-sm leading-relaxed">
          <Trans
            i18nKey="upgradeOverlaySubtitle3"
            defaults="Unlock these features by upgrading to a Pro plan."
          />
        </p>
      </PageHeader>
      <PageContent className="mx-auto max-w-4xl">
        <PricingTable />

        <div className="mt-6 text-center">
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
