import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getUser } from "@/data/get-user";

import { isUserOnboarded } from "./utils";

export const getOnboardedUser = cache(async () => {
  const user = await getUser();

  const { timeZone, locale, name } = user;

  if (!isUserOnboarded({ timeZone, locale, name })) {
    const headerList = headers();
    const pathname = headerList.get("x-pathname");
    const searchParams =
      pathname && pathname !== "/"
        ? `?redirectTo=${encodeURIComponent(pathname)}`
        : "";
    redirect(`/setup${searchParams}`);
  }

  return { ...user, timeZone, locale, name };
});
