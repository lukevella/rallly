import { renderHook } from "@testing-library/react";
import Cookies from "js-cookie";
import { setFlash, useFlash } from "@/lib/flash/client";
import { flashCookieName } from "@/lib/flash/constants";

describe("useFlash", () => {
  beforeEach(() => {
    Cookies.remove(flashCookieName("test-key"), { path: "/" });
  });

  it("returns the value once and clears it", async () => {
    setFlash("test-key", "poll_1");

    const first = renderHook(() => useFlash("test-key"));
    await vi.waitFor(() => expect(first.result.current).toBe("poll_1"));
    expect(Cookies.get(flashCookieName("test-key"))).toBeUndefined();

    const second = renderHook(() => useFlash("test-key"));
    expect(second.result.current).toBeNull();
  });

  it("stays null when nothing was flashed", () => {
    const { result } = renderHook(() => useFlash("test-key"));
    expect(result.current).toBeNull();
  });
});
