import type { PollStatus, Prisma } from "@rallly/database";
import { z } from "zod";

import { getCachedPollCountByStatus } from "@/api/get-poll-count-by-status";
import { getCachedPolls } from "@/api/get-polls";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { PollFolders } from "./poll-folders";
import { PollsTable } from "./polls-table";

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
};

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
  status = "live",
  page = 1,
  pageSize = 10,
  q,
}: PollFilters = {}) {
  const user = await requireUser();

  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    userId: user.id,
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
    getCachedPolls({ userId: user.id, status, page, pageSize, q }),
    getCachedPollCountByStatus(user.id),
  ]);

  return {
    polls,
    total,
    statusCounts,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { t } = await getTranslation(params.locale);

  // Validate each parameter individually to preserve valid parameters
  const page = pageSchema.safeParse(searchParams.page);
  const q = querySchema.safeParse(searchParams.q);
  const status = statusSchema.safeParse(searchParams.status);
  const pageSize = pageSizeSchema.safeParse(searchParams.pageSize);

  // Combine the validated parameters
  const validatedParams = {
    page: page.success ? page.data : 1,
    q: q.success ? q.data : undefined,
    status: status.success ? status.data : "live",
    pageSize: pageSize.success ? pageSize.data : 10,
  };

  // Load data with validated filters
  const { polls, total, statusCounts } = await loadData({
    status: validatedParams.status,
    page: validatedParams.page,
    pageSize: validatedParams.pageSize,
    q: validatedParams.q,
  });

  // Calculate total pages
  const totalPages = Math.ceil(total / validatedParams.pageSize);

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-3">
          <PageTitle>
            {t("polls", {
              defaultValue: "Polls",
            })}
          </PageTitle>
        </div>
      </PageHeader>
      <PageContent>
        <PollFolders statusCounts={statusCounts} />
        <PollsTable
          polls={polls}
          totalPolls={total}
          currentPage={validatedParams.page}
          totalPages={totalPages}
        />
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
