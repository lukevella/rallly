"use server";

import { prisma } from "@rallly/database";
import { requireAdmin } from "@/auth/queries";

export async function removeInstanceLicense() {
  try {
    await requireAdmin();
  } catch (_error) {
    return {
      success: false,
      message: "You must be an admin to delete a license",
    };
  }

  try {
    await prisma.instanceLicense.deleteMany();
  } catch (_error) {
    return {
      success: false,
      message: "Failed to delete license",
    };
  }

  return {
    success: true,
    message: "License deleted successfully",
  };
}
