import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PollTypeToggle } from "./poll-type-toggle";
import type { NewEventData } from "./types";

let latest: NewEventData | undefined;

function TestForm({ pollType }: { pollType: NewEventData["pollType"] }) {
  const form = useForm<NewEventData>({
    defaultValues: { pollType } as Partial<NewEventData> as NewEventData,
  });
  latest = form.watch();
  return (
    <Form {...form}>
      <PollTypeToggle />
    </Form>
  );
}

describe("PollTypeToggle", () => {
  it("shows the current type as selected", () => {
    render(<TestForm pollType="location" />);

    expect(screen.getByRole("radio", { name: "Location" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dates" })).not.toBeChecked();
  });

  it("switches the form to a location poll and back", async () => {
    const user = userEvent.setup();
    render(<TestForm pollType="date" />);

    await user.click(screen.getByRole("radio", { name: "Location" }));
    expect(latest?.pollType).toBe("location");

    await user.click(screen.getByRole("radio", { name: "Dates" }));
    expect(latest?.pollType).toBe("date");
  });
});
