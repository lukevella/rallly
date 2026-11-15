import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

vi.mock("@/lib/datetime/client", () => ({
  useDateTimeConfig: () => ({
    locale: "en",
    timeZone: "UTC",
    timeFormat: "h12",
    weekStartsOn: 0,
  }),
}));

import { PollOptionsList } from "./poll-options-list";

describe("PollOptionsList for a location poll", () => {
  it("lists each place by name with its value, without day groups", async () => {
    render(
      <PollOptionsList
        kind="location"
        timeZone={null}
        options={[
          { id: "o1", startTime: null, duration: 0, name: "Café du Centre" },
          { id: "o2", startTime: null, duration: 0, name: "Le Bistrot" },
        ]}
        renderValue={(option) => <span>{`votes for ${option.id}`}</span>}
      />,
    );

    expect(await screen.findByText("Café du Centre")).toBeInTheDocument();
    expect(screen.getByText("Le Bistrot")).toBeInTheDocument();
    expect(screen.getByText("votes for o1")).toBeInTheDocument();
    expect(screen.getByText("votes for o2")).toBeInTheDocument();
  });
});
