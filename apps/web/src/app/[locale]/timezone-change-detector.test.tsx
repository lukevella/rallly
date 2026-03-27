import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { TimeZoneChangeDetector } from "./timezone-change-detector";

let mockTimeZone = "America/New_York";
vi.mock("@/utils/date-time-utils", () => ({
  getBrowserTimeZone: () => mockTimeZone,
}));

vi.mock("@rallly/posthog/client", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

describe("TimeZoneChangeDetector", () => {
  beforeEach(() => {
    localStorage.clear();
    mockTimeZone = "America/New_York";
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

  it("accepting timezone change calls onTimeZoneChange and updates localStorage", async () => {
    const user = userEvent.setup();
    const mockOnTimeZoneChange = vi.fn();
    localStorage.setItem("previousTimeZone", "Fake/Timezone");

    render(<TimeZoneChangeDetector onTimeZoneChange={mockOnTimeZoneChange} />);
    await user.click(screen.getByText("Yes, update my timezone"));

    expect(mockOnTimeZoneChange).toHaveBeenCalledWith("America/New_York");
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });

  it("declining timezone change updates localStorage without calling onTimeZoneChange", async () => {
    const user = userEvent.setup();
    const mockOnTimeZoneChange = vi.fn();
    localStorage.setItem("previousTimeZone", "Fake/Timezone");

    render(<TimeZoneChangeDetector onTimeZoneChange={mockOnTimeZoneChange} />);
    await user.click(screen.getByText("No, keep the current timezone"));

    expect(mockOnTimeZoneChange).not.toHaveBeenCalled();
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });

  it("stores current timezone on first visit", () => {
    render(<TimeZoneChangeDetector />);
    expect(localStorage.getItem("previousTimeZone")).toBe("America/New_York");
  });
});
