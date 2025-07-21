import { onboardedUserSchema } from "@/features/setup/schema";
import type { OnboardedUser } from "@/features/setup/types";

export const isUserOnboarded = (user: Partial<OnboardedUser>) => {
  return onboardedUserSchema.safeParse(user).success;
};
