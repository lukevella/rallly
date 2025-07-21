type AppErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR"
  | "TOO_MANY_REQUESTS";

export class AppError extends Error {
  code: AppErrorCode;
  constructor({
    code,
    message,
    cause,
  }: {
    code: AppErrorCode;
    message: string;
    cause?: unknown;
  }) {
    super(`[${code}]: ${message}`);
    this.name = "AppError";
    this.code = code;
    this.cause = cause;
  }
}
