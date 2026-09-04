import { renderHook } from "@testing-library/react";
import Cookies from "js-cookie";
import { setFlash, useFlash } from "@/lib/flash/client";
import { flashCookieName } from "@/lib/flash/constants";

describe("useFlash", () => {
  beforeEach(() => {
    Cookies.remove(flashCookieName("share-poll"), { path: "/" });
  });

  it("returns the value once and clears it", async () => {
    setFlash("share-poll", "poll_1");

    const first = renderHook(() => useFlash("share-poll"));
    await vi.waitFor(() => expect(first.result.current).toBe("poll_1"));
    expect(Cookies.get(flashCookieName("share-poll"))).toBeUndefined();

    const second = renderHook(() => useFlash("share-poll"));
    expect(second.result.current).toBeNull();
  });

  it("stays null when nothing was flashed", () => {
    const { result } = renderHook(() => useFlash("share-poll"));
    expect(result.current).toBeNull();
  });
});
