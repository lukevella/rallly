import type { Context } from "hono";

export type ApiErrorDetail = { path: string; message: string };

export const apiError = (
  code: string,
  message: string,
  details?: ApiErrorDetail[],
) => ({
  error: { code, message, ...(details ? { details } : {}) },
});

type ValidationIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> | undefined;
};

type ValidationResult =
  | { success: true }
  | { success: false; error: readonly ValidationIssue[] };

// zod emits plain keys; the Standard Schema `{ key }` segment form never occurs.
const issuePath = (issue: ValidationIssue) =>
  (issue.path ?? []).map(String).join(".");

/**
 * Hook for every `validator(...)` call. The standard-validator default
 * response is `{ success, error, data }` with the request body echoed back,
 * which both breaks the documented envelope and copies client input into
 * logs and proxies. This replaces it with the envelope plus a `details`
 * array built from the issues.
 */
export const validationHook = (result: ValidationResult, c: Context) => {
  if (result.success) {
    return;
  }
  return c.json(
    apiError(
      "VALIDATION_ERROR",
      "The request did not match the expected schema. See details.",
      result.error.map((issue) => ({
        path: issuePath(issue),
        message: issue.message,
      })),
    ),
    400,
  );
};
