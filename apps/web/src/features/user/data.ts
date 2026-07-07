import type { User } from "@rallly/database";
import { prisma } from "@rallly/database";
import type { UserDTO } from "@/features/user/schema";
import { getSession } from "@/lib/auth";

export const createUserDTO = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
  image: user.image ?? undefined,
  email: user.email,
  role: user.role,
  banned: user.banned,
  timeZone: user.timeZone || undefined,
  timeFormat: user.timeFormat ?? undefined,
  locale: user.locale ?? undefined,
  weekStart: user.weekStart ?? undefined,
  customerId: user.customerId ?? undefined,
  isGuest: user.isAnonymous,
});

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

export const createSessionUserDTO = (user: SessionUser): UserDTO => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? undefined,
  role: user.role,
  banned: user.banned,
  isGuest: user.isGuest,
  timeZone: user.timeZone,
  timeFormat: user.timeFormat,
  locale: user.locale,
  weekStart: user.weekStart,
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

export function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
    },
  });
}

export const getUserSession = async () => {
  const session = await getSession();

  if (!session?.user) {
    return { session: null, user: undefined };
  }

  return { session, user: createSessionUserDTO(session.user) };
};
