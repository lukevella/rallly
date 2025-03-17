import { prisma } from "@rallly/database";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/next-auth";

export async function GET(request: NextRequest) {
  try {
    // Get the search query from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Authenticate the user
    const user = await requireUser();

    // Search for polls that match the query (case-insensitive)
    const polls = await prisma.poll.findMany({
      where: {
        userId: user.id,
        title: {
          contains: query,
          mode: "insensitive", // Case-insensitive search
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit results to 10 polls
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error("Error searching polls:", error);
    return NextResponse.json(
      { error: "Failed to search polls" },
      { status: 500 }
    );
  }
}
