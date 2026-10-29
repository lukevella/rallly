import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();

vi.mock("@rallly/database", () => ({
  prisma: {
    pollActivity: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import type { AuthorizedSpaceId } from "@/lib/tenant-scope";
import { listPollActivity } from "./data";

const spaceId = "test-space-id" as AuthorizedSpaceId;

describe("listPollActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  // A post-filter after `take` would let newer response events crowd out
  // an older poll event and leave the overview empty.
  it("excludes response events of aggregate results polls in the limited query", async () => {
    await listPollActivity({ pollId: "poll-1", spaceId, limit: 5 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pollId: "poll-1",
          NOT: {
            type: {
              in: ["response_created", "response_updated", "response_deleted"],
            },
            poll: { aggregateResultsOnly: true },
          },
        }),
        take: 5,
      }),
    );
  });
});
