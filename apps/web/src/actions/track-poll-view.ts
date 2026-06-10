"use server";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { headers } from "next/headers";
import { getUserIdIfLoggedIn } from "@/lib/auth";

const logger = createLogger("actions/track-poll-view");

/**
 * Server action to track a poll view
 * Records information about the view in the database
 */
export async function trackPollView(pollId: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    const ip = headersList.get("x-forwarded-for") || "unknown";

    const userId = await getUserIdIfLoggedIn();

    await prisma.pollView.create({
      data: {
        pollId,
        userId,
        ipAddress: ip,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error({ error, pollId }, "Failed to record poll view");
    return { success: false, error: "Failed to record view" };
  }
}
