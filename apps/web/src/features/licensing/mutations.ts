"use server";

import { requireAdmin } from "@/auth/queries";
import { prisma } from "@rallly/database";

export async function removeInstanceLicense({
  licenseId,
}: {
  licenseId: string;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    return {
      success: false,
      message: "You must be an admin to delete a license",
    };
  }

  try {
    await prisma.instanceLicense.delete({
      where: {
        id: licenseId,
      },
    });
  } catch (error) {
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
