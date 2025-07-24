import type { User } from "@rallly/database";
import { prisma } from "@rallly/database";
import type { UserDTO } from "@/features/user/schema";

export const createUserDTO = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
  image: user.image ?? undefined,
  email: user.email,
  role: user.role,
  activeSpaceId: user.activeSpaceId ?? undefined,
  timeZone: user.timeZone ?? undefined,
  timeFormat: user.timeFormat ?? undefined,
  locale: user.locale ?? undefined,
  weekStart: user.weekStart ?? undefined,
  customerId: user.customerId ?? undefined,
});

export const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return null;
  }

  return createUserDTO(user);
};
