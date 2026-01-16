import type { SpaceMemberRole as PrismaSpaceMemberRole } from "@rallly/database";
import { getSpaceSubscription } from "@/features/billing/data";
import { cached_getInstanceLicense } from "@/features/licensing/data";
import type { LicenseType } from "@/features/licensing/schema";
import type { MemberRole } from "@/features/space/schema";
import { AppError } from "@/lib/errors";
import { isSelfHosted } from "@/utils/constants";

export const toDBRole = (role: MemberRole): PrismaSpaceMemberRole => {
  switch (role) {
    case "member":
      return "MEMBER";
    case "admin":
      return "ADMIN";
  }
};

export const fromDBRole = (role: PrismaSpaceMemberRole): MemberRole => {
  switch (role) {
    case "MEMBER":
      return "member";
    case "ADMIN":
      return "admin";
  }
};

/**
 * Default seat limit for spaces without active subscriptions
 */
const DEFAULT_SEAT_LIMIT = 1;
const MAX_SEAT_LIMIT = 100;

/**
 * Returns the seat limit for self-hosted instances based on license type
 */
export function getSelfHostedSeatLimit(
  licenseType: LicenseType | null,
): number {
  if (!licenseType) {
    return DEFAULT_SEAT_LIMIT;
  }

  switch (licenseType) {
    case "PLUS":
      return 5;
    case "ORGANIZATION":
      return 50;
    case "ENTERPRISE":
      return MAX_SEAT_LIMIT;
    default:
      return DEFAULT_SEAT_LIMIT;
  }
}

/**
 * Gets the total number of seats available for a space
 * Handles both cloud-hosted (Stripe subscription) and self-hosted (license-based) deployments
 */
export async function getTotalSeatsForSpace(spaceId: string): Promise<number> {
  try {
    if (isSelfHosted) {
      // For self-hosted instances, get seat limit from instance license
      const license = await cached_getInstanceLicense();

      if (!license) {
        // No license found, return default limit
        return DEFAULT_SEAT_LIMIT;
      }

      // If license has explicit seats defined, use that
      if (license.seats && license.seats > 0) {
        return Math.min(license.seats, MAX_SEAT_LIMIT);
      }

      // Otherwise, use the license type to determine seat limit
      return getSelfHostedSeatLimit(license.type);
    } else {
      // For cloud-hosted instances, get seat count from Stripe subscription
      const subscription = await getSpaceSubscription(spaceId);

      if (!subscription || !subscription.active) {
        // Return default limit for spaces without active subscriptions
        return DEFAULT_SEAT_LIMIT;
      }

      return subscription.quantity || DEFAULT_SEAT_LIMIT;
    }
  } catch (error) {
    // Log the error for debugging but don't expose internal details
    console.error(`Failed to get total seats for space ${spaceId}:`, error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to retrieve seat information",
      cause: error,
    });
  }
}
