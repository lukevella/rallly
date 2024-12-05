import * as Sentry from "@sentry/nextjs";

/**
 * Wrapper around localStorage that catches errors and logs them to Sentry.
 */
class LocalStorage {
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
  }

  private checkLocalStorageAvailability(): boolean {
    try {
      if (typeof window === "undefined") return false;

      // Test localStorage by actually trying to use it
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        Sentry.captureException(e);
        return null;
      }
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }

  removeItem(key: string): void {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  }
}

export const safeLocalStorage = new LocalStorage();
