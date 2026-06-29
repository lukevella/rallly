import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Make `cache()` a pass-through so each call re-runs (no request-scoped memo).
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

const cookieStore = new Map<string, string>();
const mockGetLocale = vi.fn<() => Promise<string>>();
const mockGetCurrentUser = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined,
  }),
}));

vi.mock("@/i18n/server/get-locale", () => ({
  getLocale: () => mockGetLocale(),
}));

vi.mock("@/auth/data", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

import {
  TIME_FORMAT_COOKIE,
  TIMEZONE_COOKIE,
  WEEK_START_COOKIE,
} from "@/lib/localization/constants";
import { getLocalization } from "@/lib/localization/server";

beforeEach(() => {
  cookieStore.clear();
  mockGetLocale.mockReset().mockResolvedValue("en");
  mockGetCurrentUser.mockReset().mockResolvedValue(null);
});

describe("getLocalization", () => {
  it("uses cookie values and skips the DB when all cookies are present", async () => {
    cookieStore.set(TIMEZONE_COOKIE, "America/New_York");
    cookieStore.set(TIME_FORMAT_COOKIE, "hours24");
    cookieStore.set(WEEK_START_COOKIE, "3");

    const localization = await getLocalization();

    expect(localization).toEqual({
      locale: "en",
      timeZone: "America/New_York",
      timeFormat: "hours24",
      weekStart: 3,
    });
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it("falls back to the logged-in user's DB values when cookies are absent", async () => {
    mockGetCurrentUser.mockResolvedValue({
      timeZone: "Europe/Paris",
      timeFormat: "hours24",
      weekStart: 0,
    });

    const localization = await getLocalization();

    expect(localization).toEqual({
      locale: "en",
      timeZone: "Europe/Paris",
      timeFormat: "hours24",
      weekStart: 0,
    });
  });

  it("falls back to locale defaults for guests/anonymous (timeZone undefined)", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const localization = await getLocalization();

    // `en` defaults: weekStart 1, timeFormat hours12.
    expect(localization).toEqual({
      locale: "en",
      timeZone: undefined,
      timeFormat: "hours12",
      weekStart: 1,
    });
  });

  it("hits the DB when only some cookies are present", async () => {
    cookieStore.set(TIMEZONE_COOKIE, "America/New_York");
    mockGetCurrentUser.mockResolvedValue({
      timeZone: "Europe/Paris",
      timeFormat: "hours24",
      weekStart: 0,
    });

    const localization = await getLocalization();

    // timeZone comes from the cookie; the rest from the DB.
    expect(localization).toEqual({
      locale: "en",
      timeZone: "America/New_York",
      timeFormat: "hours24",
      weekStart: 0,
    });
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("ignores invalid cookie values and falls back", async () => {
    cookieStore.set(TIMEZONE_COOKIE, "America/New_York");
    cookieStore.set(TIME_FORMAT_COOKIE, "bogus");
    cookieStore.set(WEEK_START_COOKIE, "99");

    const localization = await getLocalization();

    expect(localization).toEqual({
      locale: "en",
      timeZone: "America/New_York",
      timeFormat: "hours12",
      weekStart: 1,
    });
  });
});
