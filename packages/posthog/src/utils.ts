import { POSTHOG_BOOTSTAP_DATA_COOKIE_NAME } from "./constants";

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;

export function getPosthogBootstrapCookie(bootstrapData: {
  distinctID?: string;
}) {
  if (!posthogApiKey) {
    return;
  }

  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : undefined;

  return {
    name: POSTHOG_BOOTSTAP_DATA_COOKIE_NAME,
    value: JSON.stringify(bootstrapData),
    httpOnly: false,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false,
    sameSite: "lax" as const,
    path: "/",
    domain,
  };
}
