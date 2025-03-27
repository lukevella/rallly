// Memory fallback when sessionStorage isn't available
const memoryStorage = new Map<string, string>();

/**
 * Safe wrapper for sessionStorage with memory fallback
 * Handles browser environments, private browsing modes, and SSR
 */
export const safeSessionStorage = {
  get(key: string): string | null {
    try {
      return typeof window !== "undefined"
        ? window.sessionStorage.getItem(key)
        : memoryStorage.get(key) || null;
    } catch (error) {
      console.warn("Error accessing sessionStorage:", error);
      return memoryStorage.get(key) || null;
    }
  },

  set(key: string, value: string): void {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.warn("Error setting sessionStorage:", error);
    }
    memoryStorage.set(key, value);
  },

  remove(key: string): void {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch (error) {
      console.warn("Error deleting sessionStorage:", error);
    }
    memoryStorage.delete(key);
  },
};
