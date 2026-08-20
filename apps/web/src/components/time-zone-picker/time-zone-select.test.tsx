import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { toRuntimeCanonicalIanaId } from "@/lib/utils/timezone-schema";
import { render, screen, within } from "@/test/test-utils";

import { TimeZoneSelect } from "./time-zone-select";
import {
  curatedTimezoneIds,
  getAllTimezoneIds,
  getCityFromTimezoneId,
  getCuratedTimezoneIds,
  matchesTimezoneQuery,
} from "./timezone-data";

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

describe("curated timezone list", () => {
  const curatedIds = getCuratedTimezoneIds(getAllTimezoneIds());

  const curatedCanonicalIds = new Set(curatedIds.map(toRuntimeCanonicalIanaId));

  it.each(
    Array.from(curatedTimezoneIds),
  )("keeps %s in the curated list", (curatedId) => {
    // A curated ID that matches nothing must fail here rather than vanish
    // from the default view. CLDR/ICU keeps pre-2008 tzdb IDs canonical, so
    // the runtime lists `Asia/Calcutta` where we curate `Asia/Kolkata`; the
    // intersection compares canonical forms so both spellings match.
    // Compare canonical IDs, not city labels — a label is not an identity, so
    // a label assertion would pass if a different zone shared the name.
    expect(curatedCanonicalIds).toContain(toRuntimeCanonicalIanaId(curatedId));
  });

  it("shows modern city names for zones the runtime spells with legacy IDs", () => {
    const cities = curatedIds.map(getCityFromTimezoneId);

    expect(cities).toContain("Kolkata");
    expect(cities).toContain("Kathmandu");
    expect(cities).toContain("Yangon");
    expect(cities).toContain("Ho Chi Minh");
    expect(cities).toContain("Buenos Aires");
    expect(cities).toContain("Kyiv");

    expect(cities).not.toContain("Calcutta");
    expect(cities).not.toContain("Katmandu");
    expect(cities).not.toContain("Rangoon");
    expect(cities).not.toContain("Saigon");
    expect(cities).not.toContain("Kiev");
  });

  it("does not duplicate a zone the runtime and curated set spell differently", () => {
    const kolkata = curatedIds.filter(
      (id) => getCityFromTimezoneId(id) === "Kolkata",
    );
    expect(kolkata).toHaveLength(1);
  });

  it("has one curated entry per zone", () => {
    expect(curatedCanonicalIds.size).toBe(curatedIds.length);
  });
});

describe("timezone search", () => {
  // Both directions: whichever spelling the runtime lists, either query finds
  // it. This runtime lists the legacy IDs, so the modern-ID cases guard against
  // engines that do the opposite.
  it.each([
    ["Asia/Calcutta", "Asia/Kolkata", "calcutta", "kolkata"],
    ["Asia/Katmandu", "Asia/Kathmandu", "katmandu", "kathmandu"],
    ["Asia/Rangoon", "Asia/Yangon", "rangoon", "yangon"],
    ["Asia/Saigon", "Asia/Ho_Chi_Minh", "saigon", "ho chi minh"],
    ["Europe/Kiev", "Europe/Kyiv", "kiev", "kyiv"],
    [
      "America/Buenos_Aires",
      "America/Argentina/Buenos_Aires",
      "buenos aires",
      "buenos aires",
    ],
  ])("matches %s and %s by either alias", (legacyId, modernId, legacyQuery, modernQuery) => {
    for (const id of [legacyId, modernId]) {
      expect(matchesTimezoneQuery(id, legacyQuery)).toBe(true);
      expect(matchesTimezoneQuery(id, modernQuery)).toBe(true);
    }
  });
});

describe("stored value round trip", () => {
  it.each([
    "Asia/Kolkata",
    "Asia/Kathmandu",
    "Asia/Yangon",
    "Asia/Ho_Chi_Minh",
    "Europe/Kyiv",
    "America/Argentina/Buenos_Aires",
  ])("marks %s as selected when stored in its modern spelling", async (stored) => {
    // `timezoneSchema` persists modern IDs while the runtime lists legacy
    // ones, so a stored value must still resolve to the item the list
    // renders — otherwise the saved zone reopens with nothing selected.
    const user = userEvent.setup();
    render(<TimeZoneSelect value={stored} />);

    await user.click(screen.getByRole("combobox"));

    const listbox = await screen.findByRole("listbox");
    const selected = within(listbox)
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-selected") === "true");

    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain(getCityFromTimezoneId(stored));
  });

  it("reports the modern spelling when a legacy-listed zone is picked", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<TimeZoneSelect onValueChange={onValueChange} />);

    await user.type(screen.getByRole("combobox"), "kolkata");

    const listbox = await screen.findByRole("listbox");
    const option = within(listbox)
      .getAllByRole("option")
      .find((opt) => opt.textContent?.includes("Kolkata"));

    if (!option) throw new Error("Kolkata option not found");
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith("Asia/Kolkata");
  });
});
