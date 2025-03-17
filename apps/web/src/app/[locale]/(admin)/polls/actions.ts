"use server";

import { prisma } from "@rallly/database";
import { revalidatePath } from "next/cache";

import { auth } from "@/next-auth";

/**
 * Deletes multiple polls by their IDs
 * Only allows deletion of polls owned by the current user
 */
export async function deletePolls(pollIds: string[]) {
  try {
    // Get the current user session
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Delete polls that belong to the current user
    const result = await prisma.poll.updateMany({
      where: {
        id: {
          in: pollIds,
        },
        userId: session.user.id,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    // Revalidate the polls page to reflect the changes
    revalidatePath("/polls");

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error("Failed to delete polls:", error);
    return {
      success: false,
      error: "Failed to delete polls",
    };
  }
}
