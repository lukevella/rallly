"use client";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/i18n/client";

export function CalendarPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="calendar" defaults="Calendar" />
          </PageTitle>
        </PageHeaderContent>
      </PageHeader>
      <PageContent />
    </PageContainer>
  );
}
