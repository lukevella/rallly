import { POSTHOG_BOOTSTAP_DATA_COOKIE_NAME } from "./constants";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;

export function getPosthogBootstrapCookie(bootstrapData: {
  distinctID?: string;
}) {
  if (!posthogApiKey) {
    return;
  }

  return {
    name: POSTHOG_BOOTSTAP_DATA_COOKIE_NAME,
    value: JSON.stringify(bootstrapData),
    httpOnly: false,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };
}
