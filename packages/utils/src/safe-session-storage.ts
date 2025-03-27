function setSessionStorage(key: string, value: string) {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    console.warn("Error setting sessionStorage:", error);
  }
  return false;
}

function getSessionStorage(key: string): string | null {
  try {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem(key);
    }
  } catch (error) {
    console.warn("Error getting sessionStorage:", error);
  }
  return null;
}

// Memory fallback when sessionStorage isn't available
const memoryStorage = new Map<string, string>();

function getStorage(key: string): string | null {
  const value = getSessionStorage(key);
  if (value !== null) return value;
  return memoryStorage.get(key) || null;
}

function setStorage(key: string, value: string): void {
  const success = setSessionStorage(key, value);
  if (!success) {
    memoryStorage.set(key, value);
  }
}

export const safeSessionStorage = {
  getStorage,
  setStorage,
};
