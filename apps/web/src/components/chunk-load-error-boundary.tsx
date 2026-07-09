"use client";

import { Button } from "@rallly/ui/button";
import * as Sentry from "@sentry/nextjs";
import { RotateCwIcon } from "lucide-react";
import React from "react";
import { Trans } from "@/i18n/client";

const RELOAD_FLAG_PREFIX = "rallly:chunk-reload:";

function isChunkLoadError(error: unknown) {
  if (!error) {
    return false;
  }
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk .* failed/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /Dynamic import timed out/i.test(message)
  );
}

/**
 * Error boundary for page loaders that render their content through
 * `next/dynamic(..., { ssr: false })`. If the client chunk fails to load, this
 * shows a real error state with a reload affordance instead of leaving the user
 * stuck on the loading spinner forever.
 *
 * When the failure looks like a missing chunk (usually a stale deployment) it
 * reloads the page once — guarded by `sessionStorage` so a genuinely broken
 * chunk cannot cause a reload loop — before falling back to the manual retry UI.
 */
export class ChunkLoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error);

    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const key = `${RELOAD_FLAG_PREFIX}${window.location.pathname}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
          <div className="space-y-1">
            <p className="font-medium text-sm">
              <Trans
                i18nKey="chunkLoadErrorTitle"
                defaults="Failed to load this page"
              />
            </p>
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="chunkLoadErrorDescription"
                defaults="Please check your connection and try again."
              />
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            <RotateCwIcon className="size-4" />
            <Trans i18nKey="chunkLoadErrorReload" defaults="Reload" />
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
