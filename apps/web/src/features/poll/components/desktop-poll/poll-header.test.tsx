import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({ options: {} as unknown }));

vi.mock("@/features/poll/components/poll-context", () => ({
  useOptions: () => mocks.options,
}));
vi.mock("@/features/poll/components/score-summary", () => ({
  ConnectedScoreSummary: ({ optionId }: { optionId: string }) => (
    <span data-testid="score">{optionId}</span>
  ),
}));

import PollHeader from "./poll-header";

const renderPlaces = (
  places: {
    name: string;
    address: string | null;
    url: string | null;
  }[],
) => {
  mocks.options = {
    pollType: "place",
    options: places.map((place, index) => ({
      optionId: `option-${index}`,
      type: "place",
      ...place,
    })),
  };
  render(
    <table>
      <thead>
        <PollHeader />
      </thead>
    </table>,
  );
};

describe("PollHeader for a location poll", () => {
  it("makes each place a column with its score", () => {
    renderPlaces([
      { name: "Café du Centre", address: null, url: null },
      { name: "Le Bistrot", address: null, url: null },
    ]);

    expect(
      screen.getAllByTestId("option-place-name").map((el) => el.textContent),
    ).toEqual(["Café du Centre", "Le Bistrot"]);
    expect(screen.getAllByTestId("score")).toHaveLength(2);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the address and a link to the place", () => {
    renderPlaces([
      {
        name: "Café du Centre",
        address: "12 rue de la Paix, Paris",
        url: "https://maps.example.com/cafe",
      },
    ]);

    expect(screen.getByText("12 rue de la Paix, Paris")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "maps.example.com" });
    expect(link).toHaveAttribute("href", "https://maps.example.com/cafe");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
