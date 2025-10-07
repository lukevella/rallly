"use client";

export function connect(provider: string) {
  const url = new URL(
    `/api/integrations/auth/${provider}`,
    window.location.origin,
  );
  url.searchParams.set("redirect", window.location.pathname);
  window.location.href = url.toString();
}
