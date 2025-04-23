// Assuming you have a base User type somewhere, e.g., in prisma types or a shared types file
import type { User as BaseUser } from "@prisma/client"; // Or wherever your base User type is

// Define the type for a user who has completed onboarding
// It extends the base user but makes required onboarding fields non-nullable
export interface OnboardedUser extends BaseUser {
  name: string; // Guaranteed to be a string
  timeZone: string; // Guaranteed to be a string
  locale: string; // Guaranteed to be a string
}

// You might also want a type for the potentially un-onboarded user,
// which could just be your BaseUser type
export type PotentiallyUnonboardedUser = BaseUser;
