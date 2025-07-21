import type { User } from "@rallly/database";

export const createUserDTO = (user: User) => ({
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
