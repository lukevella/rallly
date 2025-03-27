"use server";

import { prisma } from "@rallly/database";
import { ipAddress } from "@vercel/functions";
import { headers } from "next/headers";

import { auth } from "@/next-auth";

/**
 * Server action to track a poll view
 * Records information about the view in the database
 */
export async function trackPollView(pollId: string) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent");
    const ip = ipAddress(headersList) || "unknown";

    const session = await auth();
    const userId = session?.user?.id;

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
