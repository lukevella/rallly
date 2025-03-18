import { NextResponse } from "next/server";
import { z } from "zod";

import { getPolls } from "@/api/get-polls";
import { requireUser } from "@/next-auth";

// Define Zod schema for individual query parameters
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
const queryParamsSchema = z.object({
  page: pageSchema,
  q: querySchema,
  status: statusSchema,
  pageSize: pageSizeSchema,
});

// Type for validated query params
type ValidatedQueryParams = z.infer<typeof queryParamsSchema>;

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    // Validate each parameter individually to preserve valid parameters
    const page = pageSchema.safeParse(url.searchParams.get("page"));
    const q = querySchema.safeParse(url.searchParams.get("q"));
    const status = statusSchema.safeParse(url.searchParams.get("status"));
    const pageSize = pageSizeSchema.safeParse(url.searchParams.get("pageSize"));

    const validatedParams = {
      page: page.success ? page.data : 1,
      q: q.success ? q.data : undefined,
      status: status.success ? status.data : "live",
      pageSize: pageSize.success ? pageSize.data : 10,
    };

    const {
      total: totalPolls,
      data: polls,
      hasNextPage,
    } = await getPolls({
      userId: user.id,
      status: validatedParams.status,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      q: validatedParams.q,
    });

    return NextResponse.json({
      polls,
      totalPolls,
      nextPage: hasNextPage ? validatedParams.page + 1 : null,
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 },
    );
  }
}
