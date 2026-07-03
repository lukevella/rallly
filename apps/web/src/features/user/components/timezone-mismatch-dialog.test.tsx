import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TIME_ZONE_COOKIE_NAME } from "@/lib/datetime/constants";
import { TimeZoneSync } from "@/lib/datetime/timezone-sync";
import { render, screen } from "@/test/test-utils";

import { TimeZoneMismatchDialog } from "./timezone-mismatch-dialog";

let mockTimeZone = "America/New_York";
vi.mock("@/utils/date-time-utils", () => ({
  getBrowserTimeZone: () => mockTimeZone,
}));

const { mockExecute, mockRefresh } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockRefresh: vi.fn(),
}));
vi.mock("@/features/user/actions", () => ({ updateLocalizationAction: {} }));
vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: mockExecute }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function renderDialog(props: { homeTimeZone?: string } = {}) {
  return render(
    <TimeZoneSync>
      <TimeZoneMismatchDialog {...props} />
    </TimeZoneSync>,
  );
}

describe("TimeZoneMismatchDialog", () => {
  beforeEach(() => {
    mockTimeZone = "America/New_York";
    mockExecute.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    Cookies.remove(TIME_ZONE_COOKIE_NAME);
  });

  it("does not show on a first visit (no cookie), but records the zone", () => {
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(
      screen.queryByText("Timezone Mismatch Detected"),
    ).not.toBeInTheDocument();
    expect(Cookies.get(TIME_ZONE_COOKIE_NAME)).toBe("America/New_York");
  });

  it("does not show when the zone has not changed, even if it differs from the home zone", () => {
    // The settings scenario: the user deliberately set a different home zone.
    Cookies.set(TIME_ZONE_COOKIE_NAME, "America/New_York");
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(
      screen.queryByText("Timezone Mismatch Detected"),
    ).not.toBeInTheDocument();
  });

  it("shows when the viewer moved to a zone that is not their home zone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(screen.getByText("Timezone Mismatch Detected")).toBeInTheDocument();
    expect(Cookies.get(TIME_ZONE_COOKIE_NAME)).toBe("America/New_York");
  });

  it("does not show when the viewer moved back to their home zone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "America/New_York" });
    expect(
      screen.queryByText("Timezone Mismatch Detected"),
    ).not.toBeInTheDocument();
  });

  it("does not show when there is no home timezone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog();
    expect(
      screen.queryByText("Timezone Mismatch Detected"),
    ).not.toBeInTheDocument();
  });

  it("updating syncs the account zone and refreshes", async () => {
    const user = userEvent.setup();
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });

    await user.click(screen.getByText("Yes, update my timezone"));

    expect(mockExecute).toHaveBeenCalledWith({ timeZone: "America/New_York" });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("declining closes without updating the account", async () => {
    const user = userEvent.setup();
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });

    await user.click(screen.getByText("No, keep the current timezone"));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Timezone Mismatch Detected"),
    ).not.toBeInTheDocument();
  });
});
