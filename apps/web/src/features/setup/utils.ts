import { onboardedUserSchema } from "@/features/setup/schema";
import type { UserDTO } from "@/features/user/schema";

export const isUserOnboarded = (user: UserDTO) => {
  return onboardedUserSchema.safeParse(user).success;
};
