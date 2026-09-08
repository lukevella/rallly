import type { QueryClient } from "@tanstack/react-query";

// The browser's one QueryClient, created by the tRPC provider. Held here so
// sign-out can drop it without the provider having to watch for sign-out:
// cached responses carry data the next person at this browser must not
// see (host-only notes, un-hidden participants, response edit links).
let browserQueryClient: QueryClient | undefined;

export function registerBrowserQueryClient(client: QueryClient) {
  if (typeof window !== "undefined") {
    browserQueryClient = client;
  }
}

export function clearBrowserQueryCache() {
  browserQueryClient?.clear();
}
