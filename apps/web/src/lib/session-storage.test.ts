import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionStorage } from "./session-storage";

describe("createSessionStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("uses sessionStorage when the browser allows it", () => {
    createSessionStorage().setItem("draft", "value");
    expect(window.sessionStorage.getItem("draft")).toBe("value");
  });

  it("falls back to memory when reading sessionStorage throws", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    const storage = createSessionStorage();
    storage.setItem("draft", "value");
    expect(storage.getItem("draft")).toBe("value");
    expect(storage.length).toBe(1);
    storage.removeItem("draft");
    expect(storage.getItem("draft")).toBeNull();
  });

  it("falls back to memory when writing to sessionStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const storage = createSessionStorage();
    storage.setItem("draft", "value");
    expect(storage.getItem("draft")).toBe("value");
    expect(window.sessionStorage.getItem("draft")).toBeNull();
  });
});
