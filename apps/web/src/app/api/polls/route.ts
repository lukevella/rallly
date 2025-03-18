import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { requireUser } from "@/next-auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    // Parse query parameters
    const status = url.searchParams.get("status") as
      | "live"
      | "paused"
      | "finalized"
      | null;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);
    const q = url.searchParams.get("q");

    // Build the where clause based on filters
    const where: Prisma.PollWhereInput = {
      userId: user.id,
      ...(status ? { status } : { status: "live" }),
    };

    // Add search filter if provided
    if (q) {
      where.title = {
        contains: q,
        mode: "insensitive", // Case-insensitive search
      };
    }

    // Count total polls for pagination
    const [totalPolls, paginatedPolls] = await Promise.all([
      // Get total count for current filter
      prisma.poll.count({ where }),

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
          votes: {
            select: {
              id: true,
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

    // Transform the selected data to match the expected format
    const polls = paginatedPolls.map((poll) => ({
      ...poll,
      participants: poll.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        image: participant.user?.image ?? undefined,
      })),
      options: poll.options,
      votes: poll.votes,
    }));

    // Check if there are more polls to load
    const hasNextPage = page * pageSize < totalPolls;

    return NextResponse.json({
      polls,
      totalPolls,
      nextPage: hasNextPage ? page + 1 : null,
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 },
    );
  }
}
