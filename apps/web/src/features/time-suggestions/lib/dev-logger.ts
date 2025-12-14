/**
 * Development-only logger utility
 * Logs only in development, silent in production
 */

const isDev = process.env.NODE_ENV === "development";

export const devLog = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
};


