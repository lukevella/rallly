import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TIME_ZONE_COOKIE_NAME } from "@/lib/datetime/constants";
import { TimeZoneSync } from "@/lib/datetime/timezone-sync";
import { act, render, screen } from "@/test/test-utils";

import { TimeZoneMismatchDialog } from "./timezone-mismatch-dialog";

let mockTimeZone = "America/New_York";
vi.mock("@/lib/utils/date-time-utils", () => ({
  getBrowserTimeZone: () => mockTimeZone,
}));

const { mockExecute } = vi.hoisted(() => ({ mockExecute: vi.fn() }));
vi.mock("@/features/user/actions", () => ({ updateLocalizationAction: {} }));
vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: mockExecute }),
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
  });

  afterEach(() => {
    Cookies.remove(TIME_ZONE_COOKIE_NAME);
  });

  it("does not show on a first visit (no cookie), but records the zone", () => {
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();
    expect(Cookies.get(TIME_ZONE_COOKIE_NAME)).toBe("America/New_York");
  });

  it("does not show when the zone has not changed, even if it differs from the home zone", () => {
    // The settings scenario: the user deliberately set a different home zone.
    Cookies.set(TIME_ZONE_COOKIE_NAME, "America/New_York");
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();
  });

  it("shows when the viewer moved to a zone that is not their home zone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });
    expect(screen.getByText("Time zone mismatch detected")).toBeInTheDocument();
    expect(Cookies.get(TIME_ZONE_COOKIE_NAME)).toBe("America/New_York");
  });

  it("does not show when the viewer moved back to their home zone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "America/New_York" });
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();
  });

  it("does not show when there is no home timezone", () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog();
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();
  });

  it("updating syncs the account zone", async () => {
    const user = userEvent.setup();
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });

    await user.click(screen.getByText("Yes, update my time zone"));

    expect(mockExecute).toHaveBeenCalledWith({ timeZone: "America/New_York" });
  });

  it("shows when the zone changes while the tab is open and regains focus", async () => {
    Cookies.set(TIME_ZONE_COOKIE_NAME, "America/New_York");
    renderDialog({ homeTimeZone: "America/New_York" });
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();

    // Laptop reopened in a new zone: no remount, just a focus event.
    mockTimeZone = "Asia/Tokyo";
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(
      await screen.findByText("Time zone mismatch detected"),
    ).toBeInTheDocument();
    expect(Cookies.get(TIME_ZONE_COOKIE_NAME)).toBe("Asia/Tokyo");
  });

  it("declining closes without updating the account", async () => {
    const user = userEvent.setup();
    Cookies.set(TIME_ZONE_COOKIE_NAME, "Asia/Tokyo");
    renderDialog({ homeTimeZone: "Europe/Malta" });

    await user.click(screen.getByText("No, keep the current time zone"));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Time zone mismatch detected"),
    ).not.toBeInTheDocument();
  });
});
