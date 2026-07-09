import { afterEach, describe, expect, it, vi } from "vitest";
import { retryDynamicImport } from "./retry-dynamic-import";

afterEach(() => {
  vi.useRealTimers();
});

describe("retryDynamicImport", () => {
  it("resolves with the module when the import succeeds first try", async () => {
    const factory = vi.fn().mockResolvedValue("module");
    const result = await retryDynamicImport(factory)();
    expect(result).toBe("module");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("retries after a transient failure and eventually resolves", async () => {
    vi.useFakeTimers();
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error("ChunkLoadError"))
      .mockResolvedValue("module");

    const promise = retryDynamicImport(factory)();
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("module");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("gives up and rejects after exhausting all attempts", async () => {
    vi.useFakeTimers();
    const factory = vi.fn().mockRejectedValue(new Error("ChunkLoadError"));

    const promise = retryDynamicImport(factory)();
    // Attach a rejection handler up front so the eventual rejection is never
    // an unhandled promise while timers are being advanced.
    const assertion = expect(promise).rejects.toThrow("ChunkLoadError");
    await vi.runAllTimersAsync();
    await assertion;

    expect(factory).toHaveBeenCalledTimes(3);
  });

  it("times out a hanging import and retries instead of waiting forever", async () => {
    vi.useFakeTimers();
    const factory = vi
      .fn()
      // First call never settles -> should hit the timeout and retry.
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValue("module");

    const promise = retryDynamicImport(factory)();
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("module");
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
