import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import PlaceOption from "./place-option";

// The vote controls are covered with the date options; this is about what a
// place shows.
vi.mock("./poll-option", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const base = {
  yesScore: 0,
  ifNeedBeScore: 0,
  optionId: "option-1",
  optionLabel: "Café du Centre",
  onChange: vi.fn(),
};

describe("PlaceOption", () => {
  it("shows the name alone for a bare place", () => {
    render(
      <PlaceOption {...base} name="Le Bistrot" address={null} url={null} />,
    );

    expect(screen.getByText("Le Bistrot")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the address and a link that opens safely in a new tab", () => {
    render(
      <PlaceOption
        {...base}
        name="Café du Centre"
        address="12 rue de la Paix, Paris"
        url="https://maps.example.com/cafe"
      />,
    );

    expect(screen.getByText("12 rue de la Paix, Paris")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "maps.example.com" });
    expect(link).toHaveAttribute("href", "https://maps.example.com/cafe");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
