import { Form } from "@rallly/ui/form";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import type { NewEventData } from "./forms/types";
import { SelectedOptionsCount } from "./selected-options-count";

// The plural wording is a translation concern. What this component decides is
// which message to show and which count to give it, so render those.
vi.mock("@/i18n/client", () => ({
  Trans: ({
    i18nKey,
    values,
  }: {
    i18nKey: string;
    values: { count: number };
  }) => (
    <span data-testid="count" data-key={i18nKey}>
      {values.count}
    </span>
  ),
}));

function TestForm({ values }: { values: Partial<NewEventData> }) {
  const form = useForm<NewEventData>({ defaultValues: values as NewEventData });
  return (
    <Form {...form}>
      <SelectedOptionsCount />
    </Form>
  );
}

describe("SelectedOptionsCount", () => {
  it("counts dates for a poll of days", () => {
    render(
      <TestForm
        values={{
          pollType: "date",
          options: [
            { type: "date", date: "2026-11-20" },
            { type: "date", date: "2026-11-21" },
          ],
        }}
      />,
    );

    const count = screen.getByTestId("count");
    expect(count).toHaveAttribute("data-key", "createPollFooterDatesSelected");
    expect(count).toHaveTextContent("2");
  });

  it("counts times for a poll with time slots", () => {
    render(
      <TestForm
        values={{
          pollType: "date",
          options: [
            {
              type: "timeSlot",
              start: "2026-11-20T09:00:00",
              end: "2026-11-20T10:00:00",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("count")).toHaveAttribute(
      "data-key",
      "createPollFooterTimesSelected",
    );
  });

  it("counts places for a location poll, ignoring unnamed ones", () => {
    render(
      <TestForm
        values={{
          pollType: "location",
          options: [],
          places: [
            { name: "Café", address: "", url: "" },
            { name: "  ", address: "", url: "" },
            { name: "Bistrot", address: "", url: "" },
          ],
        }}
      />,
    );

    const count = screen.getByTestId("count");
    expect(count).toHaveAttribute("data-key", "createPollFooterPlacesAdded");
    expect(count).toHaveTextContent("2");
  });

  it("counts no places when the form has none", () => {
    render(<TestForm values={{ pollType: "location", options: [] }} />);

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
