import type { PollStatus, Prisma } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { getCachedPollCountByStatus } from "@/api/get-poll-count-by-status";
import { getCachedPolls } from "@/api/get-polls";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { PollFolders } from "./poll-folders";
import { PollsTable } from "./polls-table";

// Define Zod schema for individual search parameters
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
    getCachedPolls({ userId, status, page, pageSize, q }),
    getCachedPollCountByStatus(userId),
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
  const user = await requireUser();

  const parsedStatus = statusSchema.parse(searchParams.status);
  const parsedPage = pageSchema.parse(searchParams.page);
  const parsedPageSize = pageSizeSchema.parse(searchParams.pageSize);
  const parsedQuery = querySchema.parse(searchParams.q);

  const { polls, total, statusCounts } = await loadData({
    userId: user.id,
    status: parsedStatus,
    page: parsedPage,
    pageSize: parsedPageSize,
    q: parsedQuery,
  });

  const totalPages = Math.ceil(total / parsedPageSize);

  return (
    <PageContainer>
      <PageHeader className="flex items-start justify-between gap-8">
        <PageTitle>
          <Trans i18nKey="polls" defaults="Polls" />
        </PageTitle>
        <Button variant="primary" asChild>
          <Link href="/new">
            <Icon>
              <PlusIcon />
            </Icon>
            <Trans i18nKey="createPoll" defaults="Create Poll" />
          </Link>
        </Button>
      </PageHeader>
      <PageContent>
        <PollFolders statusCounts={statusCounts} />
        <PollsTable
          polls={polls}
          totalPolls={total}
          currentPage={parsedPage}
          totalPages={totalPages}
        />
      </PageContent>
    </PageContainer>
  );
}
