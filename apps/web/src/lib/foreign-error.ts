import type { ErrorEvent, StackFrame } from "@sentry/nextjs";

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
      !url.pathname.includes("/_next/")
    );
  } catch {
    return false;
  }
}

// The stacks the SDK may have parsed: the thrown value's own, or that of an
// Error held in one of its properties when a plain object was rejected.
function reportedStacks(exception: unknown) {
  try {
    const candidates: unknown[] =
      typeof exception === "object" && exception !== null
        ? [exception, ...Object.values(exception)]
        : [];
    return candidates
      .map((candidate) => (candidate as { stack?: unknown } | null)?.stack)
      .filter((stack) => typeof stack === "string");
  } catch {
    return [];
  }
}

// When the thrown value has no stack the SDK invents a single frame that
// names the page. A frame the browser reported has its location in a stack.
function isReportedFrame(frame: StackFrame, exception: unknown) {
  if (frame.lineno === undefined || frame.colno === undefined) {
    return false;
  }
  const path = (frame.filename ?? "").replace(/^app:\/\//, "");
  const location = `${path}:${frame.lineno}:${frame.colno}`;
  return reportedStacks(exception).some((stack) => stack.includes(location));
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
  const [firstFrame] = frames;
  return (
    firstFrame !== undefined &&
    frames.every((frame) =>
      isOutsideOurBundles(frame.filename?.trim() ?? ""),
    ) &&
    (frames.length > 1 || isReportedFrame(firstFrame, originalException))
  );
}
