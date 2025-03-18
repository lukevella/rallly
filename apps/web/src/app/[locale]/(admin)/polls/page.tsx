import type { PollStatus, Prisma } from "@rallly/database";
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
            name: true,
            user: {
              select: {
                image: true,
              },
            },
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
    id: poll.id,
    title: poll.title,
    status: poll.status,
    createdAt: poll.createdAt,
    participants: poll.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      image: participant.user?.image ?? undefined,
    })),
    options: poll.options,
  }));

  // Process status counts into a more usable format
  const counts = statusCounts.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    { live: 0, paused: 0, finalized: 0 },
  );

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
  const { polls, totalPolls, statusCounts, hasNextPage } = await loadData({
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
          initialTotalPolls={totalPolls}
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
