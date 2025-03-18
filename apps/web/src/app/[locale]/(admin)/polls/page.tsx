import type { PollStatus, Prisma } from "@rallly/database";
import { BarChart2Icon } from "lucide-react";
import { z } from "zod";

import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageIcon,
  PageTitle,
} from "@/app/components/page-layout";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { PollFolders } from "./poll-folders";
import { PollsTable } from "./polls-table";
import { getPolls } from "@/api/get-polls";
import { getPollCountByStatus } from "@/api/get-poll-count-by-status";

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
};

// Define a simplified type for the polls we're returning
type SimplifiedPoll = {
  id: string;
  title: string;
  status: PollStatus;
  createdAt: Date;
  participants: { id: string; name: string; image?: string }[];
  options: { id: string; startTime: Date }[];
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
const searchParamsSchema = z.object({
  page: pageSchema,
  q: querySchema,
  status: statusSchema,
  pageSize: pageSizeSchema,
});

// Type for validated search params
type ValidatedSearchParams = z.infer<typeof searchParamsSchema>;

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
  const [{ total, data: polls, hasNextPage }, statusCounts] = await Promise.all(
    [
      getPolls({ userId: user.id, status, page, pageSize, q }),
      getPollCountByStatus(user.id),
    ],
  );

  return {
    polls,
    total,
    statusCounts,
    hasNextPage,
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
  const { polls, total, statusCounts, hasNextPage } = await loadData({
    status: validatedParams.status,
    page: validatedParams.page,
    pageSize: validatedParams.pageSize,
    q: validatedParams.q,
  });

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-x-3">
          <PageIcon>
            <BarChart2Icon />
          </PageIcon>
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
          initialPolls={polls}
          initialTotalPolls={total}
          initialHasNextPage={hasNextPage}
          initialSearch={validatedParams.q}
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
