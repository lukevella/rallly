import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PollTopDates } from "./poll-top-dates";

describe("PollTopDates", () => {
  it("shows a place by its name and address, not as a calendar card", () => {
    render(
      <PollTopDates
        timeZone={null}
        participantCount={3}
        options={[
          {
            id: "o1",
            startTime: null,
            duration: 0,
            name: "Café du Centre",
            address: "12 rue de la Paix, Paris",
            votes: [{ type: "yes", count: 2 }],
          },
          {
            id: "o2",
            startTime: null,
            duration: 0,
            name: "Le Bistrot",
            address: null,
            votes: [],
          },
        ]}
      />,
    );

    expect(screen.getByText("Café du Centre")).toBeInTheDocument();
    expect(screen.getByText("12 rue de la Paix, Paris")).toBeInTheDocument();
    expect(screen.getByText("Le Bistrot")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
