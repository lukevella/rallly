"use client";

import { buttonVariants } from "@rallly/ui";
import { shortUrl } from "@rallly/utils/absolute-url";
import { ClipboardListIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/app/components/page-layout";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import { trpc } from "@/trpc/client";

function SheetsEmptyState() {
  return (
    <EmptyState className="h-96">
      <EmptyStateIcon>
        <ClipboardListIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="sheetsEmptyTitle" defaults="No sheets yet" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="sheetsEmptyDescription"
          defaults="Create a sign-up sheet so people can book the time slots you offer."
        />
      </EmptyStateDescription>
      <EmptyStateFooter>
        <Link
          href="/sheets/new"
          className={buttonVariants({ variant: "primary" })}
        >
          <PlusIcon data-icon="inline-start" />
          <Trans i18nKey="newSheet" defaults="New Sheet" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function SheetListItem({
  id,
  title,
  urlId,
  updatedAt,
}: {
  id: string;
  title: string;
  urlId: string;
  updatedAt: Date;
}) {
  return (
    <StackedListItem>
      <div className="relative -m-4 flex min-w-0 flex-1 items-center gap-2 p-4">
        <HoverPrefetchLink
          className="min-w-0 text-sm hover:underline focus:ring-ring focus-visible:ring-2"
          href={`/sheets/${id}`}
        >
          <span className="absolute inset-0" />
          <span className="block truncate font-medium">{title}</span>
        </HoverPrefetchLink>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-muted-foreground text-sm sm:inline">
          <Trans
            i18nKey="sheetUpdatedRelative"
            defaults="Updated {relativeTime}"
            values={{ relativeTime: dayjs(updatedAt).fromNow() }}
          />
        </span>
        <CopyLinkButton href={shortUrl(`/sheet/${urlId}`)} />
      </div>
    </StackedListItem>
  );
}

export function SheetsPage() {
  const [{ sheets }] = trpc.sheets.list.useSuspenseQuery();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="sheets" defaults="Sheets" />
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href="/sheets/new"
            className={buttonVariants({ variant: "primary" })}
          >
            <PlusIcon data-icon="inline-start" />
            <Trans i18nKey="newSheet" defaults="New Sheet" />
          </Link>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        {sheets.length === 0 ? (
          <SheetsEmptyState />
        ) : (
          <StackedList>
            {sheets.map((sheet) => (
              <SheetListItem
                key={sheet.id}
                id={sheet.id}
                title={sheet.title}
                urlId={sheet.urlId}
                updatedAt={sheet.updatedAt}
              />
            ))}
          </StackedList>
        )}
      </PageContent>
    </PageContainer>
  );
}
