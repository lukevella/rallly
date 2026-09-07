import type { Context } from "hono";

export const apiError = (code: string, message: string) => ({
  error: { code, message },
});

type ValidationIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> | undefined;
};

type ValidationResult =
  | { success: true }
  | { success: false; error: readonly ValidationIssue[] };

// zod emits plain keys; the Standard Schema `{ key }` segment form never occurs.
const describeIssue = (issue: ValidationIssue) => {
  const path = (issue.path ?? []).map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
};

/**
 * Hook for every `validator(...)` call. The standard-validator default
 * response is `{ success, error, data }` with the request body echoed back,
 * which both breaks the documented envelope and copies client input into
 * logs and proxies. This replaces it with the envelope, one issue per
 * sentence in `message`.
 */
export const validationHook = (result: ValidationResult, c: Context) => {
  if (result.success) {
    return;
  }
  return c.json(
    apiError("VALIDATION_ERROR", result.error.map(describeIssue).join("; ")),
    400,
  );
};
