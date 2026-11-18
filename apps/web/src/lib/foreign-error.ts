import type { ErrorEvent, StackFrame } from "@sentry/nextjs";

// The Sentry Next.js SDK rewrites the origin of every frame URL to `app://`
// before `beforeSend` runs, so a URL frame arrives here as `app:///<path>`
// whichever origin served it. `http(s):` is kept for frames the SDK could
// not parse.
const URL_FRAME_PROTOCOLS = ["app:", "http:", "https:"];

function isOutsideOurBundles(frame: StackFrame) {
  try {
    const url = new URL(frame.filename?.trim() ?? "");
    return (
      URL_FRAME_PROTOCOLS.includes(url.protocol) &&
      !url.pathname.includes("/_next/")
    );
  } catch {
    return false;
  }
}

// When a thrown value has no stack the SDK invents one frame that names the
// page, with no function. A lone frame of that shape says nothing about
// where the code ran, even though a browser can report the same shape for
// top-level code.
function isPossiblyInvented(frames: StackFrame[]) {
  return frames.length === 1 && (frames[0]?.function ?? "?") === "?";
}

// An error whose every frame is a URL outside our bundles came from a script
// injected by an extension or in-app browser (inline in the page, or served
// from a path we don't own). An exception without frames, or with any frame
// of unknown origin (no filename, `<anonymous>`, native code), is kept.
export function isForeignError(event: Pick<ErrorEvent, "exception">) {
  const exceptions = event.exception?.values ?? [];
  return (
    exceptions.length > 0 &&
    exceptions.every((exception) => {
      const frames = exception.stacktrace?.frames ?? [];
      return (
        frames.length > 0 &&
        !isPossiblyInvented(frames) &&
        frames.every(isOutsideOurBundles)
      );
    })
  );
}
