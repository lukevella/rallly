import { Button } from "@rallly/ui/button";
import Link from "next/link";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";

export function PollsPageHeader() {
  return (
    <div className="flex gap-4">
      <PageHeader className="flex-1">
        <PageTitle>
          <Trans i18nKey="polls" defaults="Polls" />
        </PageTitle>
        <PageDescription>
          <Trans
            i18nKey="pollsPageDesc"
            defaults="View and manage all your scheduling polls"
          />
        </PageDescription>
      </PageHeader>
      <div className="flex items-start gap-2">
        <Button size="sm" asChild>
          <Link href="/new">
            <Trans i18nKey="create" defaults="Create" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
