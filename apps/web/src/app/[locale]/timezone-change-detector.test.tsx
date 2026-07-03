import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { TimeZoneChangeDetector } from "./timezone-change-detector";

let mockTimeZone = "America/New_York";
vi.mock("@/utils/date-time-utils", () => ({
  getBrowserTimeZone: () => mockTimeZone,
}));

const { mockExecute } = vi.hoisted(() => ({ mockExecute: vi.fn() }));
vi.mock("@/features/user/actions", () => ({ updateLocalizationAction: {} }));
vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: mockExecute }),
}));

describe("TimeZoneChangeDetector", () => {
  beforeEach(() => {
    localStorage.clear();
    mockTimeZone = "America/New_York";
    mockExecute.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not show modal on initial load with no previous timezone", () => {
    render(<TimeZoneChangeDetector />);
    expect(
      screen.queryByText("Timezone Change Detected"),
    ).not.toBeInTheDocument();
  });

  it("shows modal if stored timezone differs from current", () => {
    localStorage.setItem("previousTimeZone", "Fake/Timezone");
    render(<TimeZoneChangeDetector />);
    expect(screen.getByText("Timezone Change Detected")).toBeInTheDocument();
  });

  it("accepting the change updates the localization and localStorage", async () => {
    const user = userEvent.setup();
    localStorage.setItem("previousTimeZone", "Fake/Timezone");

    render(<TimeZoneChangeDetector />);
    await user.click(screen.getByText("Yes, update my timezone"));

    expect(mockExecute).toHaveBeenCalledWith({ timeZone: "America/New_York" });
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });

  it("declining the change updates localStorage without updating localization", async () => {
    const user = userEvent.setup();
    localStorage.setItem("previousTimeZone", "Fake/Timezone");

    render(<TimeZoneChangeDetector />);
    await user.click(screen.getByText("No, keep the current timezone"));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });

  it("stores current timezone on first visit", () => {
    render(<TimeZoneChangeDetector />);
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });
});
