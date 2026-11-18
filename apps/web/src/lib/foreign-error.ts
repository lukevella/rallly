import type { ErrorEvent } from "@sentry/nextjs";

// The Sentry Next.js SDK rewrites the origin of every frame URL to `app://`
// before `beforeSend` runs, so a URL frame arrives here as `app:///<path>`
// whichever origin served it. `http(s)://` is kept for frames the SDK could
// not parse.
const URL_FRAME = /^(?:app|https?):\/\//;

// An error whose every frame is a URL outside our bundles came from a script
// injected by an extension or in-app browser (inline in the page, or served
// from a path we don't own). A stack without frames, or with any frame of
// unknown origin (no filename, `<anonymous>`, native code), is kept.
export function isForeignError(event: Pick<ErrorEvent, "exception">) {
  const frames =
    event.exception?.values?.flatMap(
      (exception) => exception.stacktrace?.frames ?? [],
    ) ?? [];
  return (
    frames.length > 0 &&
    frames.every((frame) => {
      const filename = frame.filename?.trim() ?? "";
      return URL_FRAME.test(filename) && !filename.includes("/_next/");
    })
  );
}
