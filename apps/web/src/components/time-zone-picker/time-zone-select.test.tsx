import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@/test/test-utils";

import { TimeZoneSelect } from "./time-zone-select";

describe("TimeZoneSelect", () => {
  it("should render the combobox input", () => {
    render(<TimeZoneSelect />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should show selected timezone as input value", () => {
    render(<TimeZoneSelect value="America/New_York" />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("New York");
  });

  it("should show curated timezones when opened without typing", async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect />);

    await user.click(screen.getByRole("combobox"));

    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    // Should show curated list (100+ entries but not the full 400+)
    expect(options.length).toBeGreaterThan(50);
    expect(options.length).toBeLessThan(200);
  });

  it("should filter results when typing a city name", async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect />);

    const input = screen.getByRole("combobox");
    await user.type(input, "tokyo");

    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(options.some((opt) => opt.textContent?.includes("Tokyo"))).toBe(
      true,
    );
  });

  it("should show non-curated timezones when searching", async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect />);

    const input = screen.getByRole("combobox");
    await user.type(input, "malta");

    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    expect(options.some((opt) => opt.textContent?.includes("Malta"))).toBe(
      true,
    );
  });

  it("should call onValueChange when selecting a timezone", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<TimeZoneSelect onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "london");

    const listbox = await screen.findByRole("listbox");
    const londonOption = within(listbox)
      .getAllByRole("option")
      .find((opt) => opt.textContent?.includes("London"));

    if (!londonOption) throw new Error("London option not found");
    await user.click(londonOption);

    expect(onValueChange).toHaveBeenCalledWith("Europe/London");
  });

  it("should be case-insensitive when filtering", async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect />);

    const input = screen.getByRole("combobox");
    await user.type(input, "NEW YORK");

    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    expect(options.some((opt) => opt.textContent?.includes("New York"))).toBe(
      true,
    );
  });

  it("should show no options for nonsense query", async () => {
    const user = userEvent.setup();
    render(<TimeZoneSelect />);

    const input = screen.getByRole("combobox");
    await user.type(input, "xyznotaplace");

    // The combobox should indicate the list is empty via data attribute
    expect(input).toHaveAttribute("data-list-empty", "");
  });
});
