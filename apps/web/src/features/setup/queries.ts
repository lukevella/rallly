import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { loadUserAbility } from "@/data/user";
import { onboardedUserSchema } from "./schema";

export const getOnboardedUser = cache(async () => {
  const { user } = await loadUserAbility();

  const onboardedUser = onboardedUserSchema.safeParse(user);

  if (!onboardedUser.success) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname");
    const searchParams =
      pathname && pathname !== "/"
        ? `?redirectTo=${encodeURIComponent(pathname)}`
        : "";
    redirect(`/setup${searchParams}`);
  }

  return {
    ...user,
    timeZone: onboardedUser.data.timeZone,
    locale: onboardedUser.data.locale,
    name: onboardedUser.data.name,
  };
});
