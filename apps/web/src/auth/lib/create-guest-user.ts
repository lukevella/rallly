import { randomid } from "@rallly/utils/nanoid";

import type { User } from "../schema";

export async function createGuestUser(initialData: Partial<User>) {
  const user: User = {
    id: initialData.id ?? `user-${randomid()}`,
    createdAt: new Date().toISOString(),
    locale: initialData.locale ?? "en",
  };
  return user;
}
