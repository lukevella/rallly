"use server";

import { prisma } from "@rallly/database";
import { headers } from "next/headers";

import { getUserId } from "@/next-auth";

/**
 * Server action to track a poll view
 * Records information about the view in the database
 */
export async function trackPollView(pollId: string) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent");
    const ip = headersList.get("x-forwarded-for") || "unknown";

    const userId = await getUserId();
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
    console.error("Error recording poll view:", error);
    return { success: false, error: "Failed to record view" };
  }
}
