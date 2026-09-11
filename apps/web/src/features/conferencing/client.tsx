"use client";

// Starts the OAuth flow for a conferencing integration; the callback lands
// the user back on the page they left with `connected` or `error` set.
export const connectToConferencing = (
  integrationId: string,
  options: { redirectTo?: string } = {},
) => {
  const redirectTo = options.redirectTo || window.location.pathname;
  const url = new URL(
    `/api/integrations/auth/${integrationId}`,
    window.location.origin,
  );
  url.searchParams.set("redirect", redirectTo);
  window.location.href = url.toString();
};
