import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
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

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
};

// Define a simplified type for the polls we're returning
type SimplifiedPoll = {
  id: string;
  title: string;
  status: PollStatus;
  createdAt: Date;
  participants: { id: string }[];
  options: { id: string; startTime: Date }[];
};

async function loadData({ status, page = 1, pageSize = 10 }: PollFilters = {}) {
  const user = await requireUser();

  // Build the where clause based on filters
  const where = {
    userId: user.id,
    ...(status ? { status } : {}),
  };

  // Count total polls for pagination and folder counts
  const [totalPolls, statusCounts, paginatedPolls] = await Promise.all([
    // Get total count for current filter
    prisma.poll.count({ where }),

    // Get counts for each status for the folder badges
    prisma.poll.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    }),

    // Get paginated polls with the current filter
    prisma.poll.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        participants: {
          select: {
            id: true,
          },
        },
        options: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Transform the selected data to match the expected format for PollsTable
  const polls: SimplifiedPoll[] = paginatedPolls.map((poll) => ({
    ...poll,
    participants: poll.participants,
    options: poll.options,
  }));

  // Process status counts into a more usable format
  const counts = {
    all: await prisma.poll.count({ where: { userId: user.id } }),
    live: 0,
    paused: 0,
    finalized: 0,
  };

  statusCounts.forEach((item) => {
    if (
      item.status === "live" ||
      item.status === "paused" ||
      item.status === "finalized"
    ) {
      counts[item.status] = item._count;
    }
  });

  // Check if there are more polls to load
  const hasNextPage = page * pageSize < totalPolls;

  return {
    polls,
    totalPolls,
    statusCounts: counts,
    hasNextPage,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { status?: string; page?: string };
  children?: React.ReactNode;
}) {
  const { t } = await getTranslation(params.locale);

  // Parse page number from query params
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  // Convert status string to PollStatus type if it exists and is valid
  let status: PollStatus | undefined;
  if (
    searchParams.status === "live" ||
    searchParams.status === "paused" ||
    searchParams.status === "finalized"
  ) {
    status = searchParams.status;
  }

  // Load data with filters
  const { polls, totalPolls, statusCounts, hasNextPage } = await loadData({
    status,
    page,
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
          initialTotalPolls={totalPolls}
          initialHasNextPage={hasNextPage}
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
