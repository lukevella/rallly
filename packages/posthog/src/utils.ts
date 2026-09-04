import type { CaptureResult } from "posthog-js";

/**
 * Stack-frame function names that only ever appear in password-manager browser
 * extension content scripts (1Password/Dashlane-style form scanners), never in
 * our own code. Such extensions scan the page for login forms, misread our
 * invite voting form (`voting-form.tsx`) as a login form, and throw a
 * `DOMException: InvalidAccessError` from inside their own `MutationObserver`
 * callback. PostHog's exception autocapture then attributes the error to our
 * page URL, so this third-party noise ends up in error tracking.
 *
 * Matching any of these frames lets us drop the whole noise class — including
 * future variants such as other `logLogin*Detected` probes — before it is sent.
 */
const EXTENSION_NOISE_FRAME_PATTERN =
  /^(dispatchToBridge|logLogin\w*Detected)$/;

export function isInjectedExtensionException(event: CaptureResult) {
  const exceptionList = event.properties?.$exception_list as
    | Array<{ stacktrace?: { frames?: Array<{ function?: string }> } }>
    | undefined;

  if (!Array.isArray(exceptionList)) {
    return false;
  }

  return exceptionList.some((exception) =>
    exception?.stacktrace?.frames?.some(
      (frame) =>
        typeof frame?.function === "string" &&
        EXTENSION_NOISE_FRAME_PATTERN.test(frame.function),
    ),
  );
}

/**
 * A request that is aborted (React Query cancels an in-flight query on unmount
 * or navigation) surfaces as an `AbortError`. When it wraps a tRPC request, the
 * `$exception_list` holds a `TRPCClientError` ("The operation was aborted.")
 * chained to a `DOMException` whose value starts with "AbortError:". Nothing
 * broke for the user, so this is autocapture noise, not a real error.
 */
const ABORT_NOISE_VALUE_PATTERN =
  /^AbortError\b|operation was aborted|user aborted a request/i;

export function isAbortError(event: CaptureResult) {
  const exceptionList = event.properties?.$exception_list as
    | Array<{ type?: string; value?: string }>
    | undefined;

  if (!Array.isArray(exceptionList)) {
    return false;
  }

  return exceptionList.some(
    (exception) =>
      exception?.type === "AbortError" ||
      (typeof exception?.value === "string" &&
        ABORT_NOISE_VALUE_PATTERN.test(exception.value)),
  );
}

/**
 * The browser fires `ResizeObserver loop completed with undelivered
 * notifications.` on `window.onerror` when a ResizeObserver callback changes
 * layout and the browser cannot deliver every notification inside one animation
 * frame. Nothing breaks — it is a notice, not a crash — so autocapture must not
 * report it as a real error.
 */
const RESIZE_OBSERVER_LOOP_VALUE_PATTERN =
  /^ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i;

export function isResizeObserverLoopError(event: CaptureResult) {
  const exceptionList = event.properties?.$exception_list as
    | Array<{ value?: string }>
    | undefined;

  if (!Array.isArray(exceptionList)) {
    return false;
  }

  return exceptionList.some(
    (exception) =>
      typeof exception?.value === "string" &&
      RESIZE_OBSERVER_LOOP_VALUE_PATTERN.test(exception.value),
  );
}

/**
 * An iOS-only throw reaches error tracking with a bare minified identifier as
 * its message (`fa`, `ga`, `Ba`, `Ca`, ...) and a stack whose every frame
 * resolves to the HTML document (`filename: https://app.rallly.co/`,
 * `function: "?"`) instead of a `/_next/static` chunk. Only chunk files ship
 * source maps (`productionBrowserSourceMaps` in next.config.ts), so an inline
 * document script can never be symbolicated and the stack stays useless. The
 * minifier renames the symbol on each release, so the message is part of the
 * fingerprint and every deploy opens a fresh, uninvestigable issue.
 *
 * Match a short minified identifier value together with a stack that carries no
 * `/_next/static` frame. This drops the whole class and covers the next rename.
 */
const MINIFIED_IDENTIFIER_VALUE_PATTERN = /^[A-Za-z$_][\w$]{0,2}$/;

export function isUnsymbolicatedMinifiedException(event: CaptureResult) {
  const exceptionList = event.properties?.$exception_list as
    | Array<{
        value?: string;
        stacktrace?: { frames?: Array<{ filename?: string }> };
      }>
    | undefined;

  if (!Array.isArray(exceptionList)) {
    return false;
  }

  return exceptionList.some((exception) => {
    if (
      typeof exception?.value !== "string" ||
      !MINIFIED_IDENTIFIER_VALUE_PATTERN.test(exception.value)
    ) {
      return false;
    }

    const frames = exception.stacktrace?.frames;
    if (!Array.isArray(frames) || frames.length === 0) {
      return false;
    }

    return !frames.some((frame) => frame?.filename?.includes("/_next/static"));
  });
}
