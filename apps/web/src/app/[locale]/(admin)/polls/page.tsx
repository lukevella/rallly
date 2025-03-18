import type { PollStatus, Prisma } from "@rallly/database";
import { BarChart2Icon } from "lucide-react";

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

  // Get page from URL if available
  const page = searchParams.page
    ? parseInt(searchParams.page as string, 10)
    : 1;

  // Get search query from URL if available
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  // Convert status string to PollStatus type if it exists and is valid
  let status: PollStatus | undefined;
  const statusParam = searchParams.status;
  if (
    typeof statusParam === "string" &&
    (statusParam === "live" ||
      statusParam === "paused" ||
      statusParam === "finalized")
  ) {
    status = statusParam;
  }

  // Load data with filters
  const { polls, total, statusCounts, hasNextPage } = await loadData({
    status,
    page,
    q,
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
          initialSearch={q}
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
