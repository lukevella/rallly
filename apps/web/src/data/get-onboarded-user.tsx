import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isUserOnboarded } from "@/features/setup/utils";

import { getUser } from "./get-user";

export const getOnboardedUser = cache(async () => {
  const user = await getUser();

  if (!isUserOnboarded(user)) {
    const headerList = headers();
    const pathname = headerList.get("x-pathname");
    const searchParams =
      pathname && pathname !== "/"
        ? `?redirectTo=${encodeURIComponent(pathname)}`
        : "";
    redirect(`/setup${searchParams}`);
  }

  return {
    ...user,
    timeZone: user.timeZone as string,
    locale: user.locale as string,
    name: user.name as string,
  };
});
