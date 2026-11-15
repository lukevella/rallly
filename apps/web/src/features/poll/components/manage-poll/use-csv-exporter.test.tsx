import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  poll: {
    title: "Where do we eat",
    timeZone: null as string | null,
    options: [] as unknown[],
  },
  participants: [] as unknown[],
}));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => mocks.poll,
  useParticipants: () => ({ participants: mocks.participants }),
}));
vi.mock("@/lib/datetime/client", () => ({
  useDateTimeConfig: () => ({
    locale: "en",
    timeZone: "UTC",
    timeFormat: "h24",
  }),
}));
vi.mock("@/i18n/client", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

import { useCsvExporter } from "./use-csv-exporter";

const exportCsv = () => {
  let href = "";
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      href = this.getAttribute("href") ?? "";
    });
  const { result } = renderHook(() => useCsvExporter());
  result.current.exportToCsv();
  click.mockRestore();
  return decodeURI(href.replace("data:text/csv;charset=utf-8,", "")).split(
    "\r\n",
  );
};

describe("useCsvExporter for a location poll", () => {
  afterEach(() => vi.restoreAllMocks());

  it("makes each place a column, quoted so a comma can't shift the columns", () => {
    mocks.poll.options = [
      { id: "o1", startTime: null, duration: 0, name: 'Café, "Centre"' },
      { id: "o2", startTime: null, duration: 0, name: "Le Bistrot" },
    ];
    mocks.participants = [
      {
        id: "p1",
        name: "Anne",
        email: "anne@example.com",
        createdAt: new Date("2026-11-15T10:00:00Z"),
        votes: [{ optionId: "o1", type: "yes" }],
      },
    ];

    const [header, anne] = exportCsv();

    expect(header).toContain('"Café, ""Centre"""');
    expect(header).toContain('"Le Bistrot"');
    expect(anne.startsWith("Anne,anne@example.com,")).toBe(true);
    expect(anne.endsWith(",yes,no")).toBe(true);
  });
});
