import type { NextResponse } from "next/server";

import { POSTHOG_BOOTSTAP_DATA_COOKIE_NAME } from "../constants";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;

export async function withPostHog(
  res: NextResponse,
  bootstrapData: { distinctID?: string },
) {
  if (!posthogApiKey) {
    return;
  }

  res.cookies.set({
    name: POSTHOG_BOOTSTAP_DATA_COOKIE_NAME,
    value: JSON.stringify(bootstrapData),
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
