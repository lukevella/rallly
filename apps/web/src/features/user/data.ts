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
  timeZone: user.timeZone ?? undefined,
  timeFormat: user.timeFormat ?? undefined,
  locale: user.locale ?? undefined,
  weekStart: user.weekStart ?? undefined,
  customerId: user.customerId ?? undefined,
  isGuest: user.isAnonymous,
});

const createGuestDTO = (session: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  locale?: string;
  timeZone?: string;
}): UserDTO => ({
  id: session.id,
  name: session.name,
  email: session.email,
  image: session.image ?? undefined,
  role: "user",
  banned: false,
  isGuest: true,
  locale: session.locale,
  timeZone: session.timeZone,
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

export const getUserSession = async () => {
  const session = await getSession();

  if (!session?.user) {
    return { session: null, user: undefined };
  }

  const user = session.user.isGuest
    ? createGuestDTO(session.user)
    : ((await getUser(session.user.id)) ?? undefined);

  return { session, user };
};
