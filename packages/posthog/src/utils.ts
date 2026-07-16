import type { CaptureResult } from "posthog-js";

type NavigatorWithGlobalPrivacyControl = Navigator & {
  globalPrivacyControl?: boolean;
};

export function isGlobalPrivacyControlEnabled() {
  return (
    typeof navigator !== "undefined" &&
    (navigator as NavigatorWithGlobalPrivacyControl).globalPrivacyControl ===
      true
  );
}

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
