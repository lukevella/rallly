import type { ErrorEvent } from "@sentry/nextjs";

// The Sentry Next.js SDK rewrites the origin of every frame URL to `app://`
// before `beforeSend` runs, so a URL frame arrives here as `app:///<path>`
// whichever origin served it. `http(s):` is kept for frames the SDK could
// not parse.
const URL_FRAME_PROTOCOLS = ["app:", "http:", "https:"];

function isOutsideOurBundles(filename: string) {
  try {
    const url = new URL(filename);
    return (
      URL_FRAME_PROTOCOLS.includes(url.protocol) &&
      !url.pathname.startsWith("/_next/")
    );
  } catch {
    return false;
  }
}

// When the thrown value has no stack, the SDK invents one frame that names
// the page. Only a stack the browser reported says where the code ran.
function hasStackLocation(exception: unknown) {
  const stack = (exception as { stack?: unknown } | null | undefined)?.stack;
  return typeof stack === "string" && /:\d+:\d+/.test(stack);
}

// An error whose every frame is a URL outside our bundles came from a script
// injected by an extension or in-app browser (inline in the page, or served
// from a path we don't own). A stack without frames, or with any frame of
// unknown origin (no filename, `<anonymous>`, native code), is kept.
export function isForeignError({
  event,
  originalException,
}: {
  event: Pick<ErrorEvent, "exception">;
  originalException: unknown;
}) {
  const frames =
    event.exception?.values?.flatMap(
      (exception) => exception.stacktrace?.frames ?? [],
    ) ?? [];
  return (
    frames.length > 0 &&
    hasStackLocation(originalException) &&
    frames.every((frame) => isOutsideOurBundles(frame.filename?.trim() ?? ""))
  );
}
