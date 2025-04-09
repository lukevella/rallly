import type { PollStatus, Prisma } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { PollPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { getPollCountByStatus } from "@/data/get-poll-count-by-status";
import { getPolls } from "@/data/get-polls";
import { PollSelectionProvider } from "@/features/poll-selection/context";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { PollsTabbedView } from "./poll-folders";
import { PollsList } from "./polls-list";
import { SearchInput } from "./search-input";

const pageSchema = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val) return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });

const querySchema = z
  .string()
  .nullish()
  .transform((val) => val?.trim() || undefined);

const statusSchema = z
  .enum(["live", "paused", "finalized"])
  .nullish()
  .transform((val) => val || "live");

const pageSizeSchema = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val) return 10;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
  });

// Combined schema for type inference
async function loadData({
  userId,
  status = "live",
  page = 1,
  pageSize = 10,
  q,
}: {
  userId: string;
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    userId,
    status,
  };

  // Add search filter if provided
  if (q) {
    where.title = {
      contains: q,
      mode: "insensitive",
    };
  }

  // Count total polls for pagination and folder counts
  const [{ total, data: polls }, statusCounts] = await Promise.all([
    getPolls({ userId, status, page, pageSize, q }),
    getPollCountByStatus(userId),
  ]);

  return {
    polls,
    total,
    statusCounts,
  };
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { userId } = await requireUser();

  const parsedStatus = statusSchema.parse(searchParams.status);
  const parsedPage = pageSchema.parse(searchParams.page);
  const parsedPageSize = pageSizeSchema.parse(searchParams.pageSize);
  const parsedQuery = querySchema.parse(searchParams.q);

  const { polls, total } = await loadData({
    userId,
    status: parsedStatus,
    page: parsedPage,
    pageSize: parsedPageSize,
    q: parsedQuery,
  });

  const totalPages = Math.ceil(total / parsedPageSize);

  return (
    <PageContainer>
      <div className="flex gap-4">
        <PageHeader className="flex-1">
          <PageTitle>
            <PollPageIcon />
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
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/polls">
              <Icon>
                <SettingsIcon />
              </Icon>
            </Link>
          </Button>
          <Button variant="primary" size="icon" asChild>
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
            </Link>
          </Button>
        </div>
      </div>
      <PageContent className="space-y-4">
        <PollsTabbedView>
          <div className="space-y-4">
            <SearchInput />
            <PollSelectionProvider>
              <PollsList
                polls={polls}
                totalPolls={total}
                currentPage={parsedPage}
                totalPages={totalPages}
              />
            </PollSelectionProvider>
          </div>
        </PollsTabbedView>
      </PageContent>
    </PageContainer>
  );
}
