import pino from "pino";
import pinoPretty from "pino-pretty";

const level = process.env.LOG_LEVEL ?? "info";
const isDevelopment = process.env.NODE_ENV === "development";

const stream = isDevelopment
  ? pinoPretty({
      colorize: true,
    })
  : undefined;

export const logger = pino(
  {
    level,
  },
  stream,
);

export type Logger = typeof logger;

export function createLogger(name: string) {
  return logger.child({ name });
}
