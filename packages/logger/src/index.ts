import pino from "pino";
import pinoPretty from "pino-pretty";

const level = process.env.LOG_LEVEL ?? "info";
const isDevelopment = process.env.NODE_ENV === "development";

const stream = isDevelopment
  ? pinoPretty({
      colorize: true,
    })
  : undefined;

// Defence in depth: call sites are not supposed to log addresses at all, but
// a stray field must not reach the sink with the sink's retention.
const redact = ["email", "recipient", "to"].flatMap((key) => [key, `*.${key}`]);

export const logger = pino(
  {
    level,
    redact,
  },
  stream,
);

export type Logger = typeof logger;

export function createLogger(name: string) {
  return logger.child({ name });
}

export { createWideEvent, type WideEvent } from "./wide-event";
