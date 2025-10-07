"use client";

interface ConnectOptions {
  /**
   * URL to redirect to after successful connection
   */
  redirectTo?: string;
}

/**
 * Initiate calendar connection OAuth flow
 * @param integrationId - Calendar integration ID to connect
 * @param options - Connection options
 */
export const connectToCalendar = (
  integrationId: string,
  options: ConnectOptions = {},
) => {
  const redirectTo = options.redirectTo || window.location.pathname;

  const url = new URL(
    `/api/integrations/auth/${integrationId}`,
    window.location.origin,
  );

  url.searchParams.set("redirect", redirectTo);

  window.location.href = url.toString();
};
