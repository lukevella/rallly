function createMemoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => Array.from(items.keys())[index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
}

/**
 * sessionStorage that falls back to memory when the browser blocks it.
 * Safari throws a SecurityError on reading `window.sessionStorage` when the
 * user blocks cookies. The browser is resolved on first use, so this can be
 * created at module scope and passed where a stable reference is required.
 */
export function createSessionStorage(): Storage {
  let storage: Storage | undefined;
  const resolve = () => {
    if (!storage) {
      try {
        storage = window.sessionStorage;
      } catch {
        storage = createMemoryStorage();
      }
    }
    return storage;
  };
  return {
    get length() {
      return resolve().length;
    },
    clear: () => resolve().clear(),
    getItem: (key) => resolve().getItem(key),
    key: (index) => resolve().key(index),
    removeItem: (key) => resolve().removeItem(key),
    setItem: (key, value) => {
      try {
        resolve().setItem(key, value);
      } catch {
        // setItem can throw QuotaExceededError even when reading is allowed
        storage = createMemoryStorage();
        storage.setItem(key, value);
      }
    },
  };
}
