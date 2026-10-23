"use client";

import {
  PageShell,
  PageShellContent,
  PageShellHeader,
  PageShellHeaderStart,
  PageShellTitle,
} from "@/components/page-shell";
import { Trans } from "@/i18n/client";

export function CalendarPage() {
  return (
    <PageShell>
      <PageShellHeader>
        <PageShellHeaderStart>
          <PageShellTitle>
            <Trans i18nKey="calendar" defaults="Calendar" />
          </PageShellTitle>
        </PageShellHeaderStart>
      </PageShellHeader>
      <PageShellContent />
    </PageShell>
  );
}
