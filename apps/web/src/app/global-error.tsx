"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
        {/* global-error replaces the root layout, so app UI/providers are
        unavailable here. Offer a bare retry that re-attempts the render. */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
