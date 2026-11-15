import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { PollPlacesForm } from "@/features/poll/components/forms/poll-places-form";
import { MAX_POLL_PLACES } from "@/features/poll/schema";
import { render, screen } from "@/test/test-utils";
import type { NewEventData } from "./types";

let latest: NewEventData | undefined;

function TestForm({
  places = [],
  pollType = "location",
}: {
  places?: NewEventData["places"];
  pollType?: NewEventData["pollType"];
}) {
  const form = useForm<NewEventData>({
    defaultValues: { pollType, places, options: [] } as Partial<NewEventData>,
  });
  latest = form.watch();
  return (
    <Form {...form}>
      <PollPlacesForm />
    </Form>
  );
}

describe("PollPlacesForm", () => {
  it("starts with one empty place to type into", async () => {
    render(<TestForm />);

    expect(await screen.findAllByTestId("place-row")).toHaveLength(1);
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("keeps the places it is given", async () => {
    render(
      <TestForm
        places={[
          { name: "Café du Centre", address: "12 rue de la Paix", url: "" },
          { name: "Le Bistrot", address: "", url: "" },
        ]}
      />,
    );

    expect(await screen.findAllByTestId("place-row")).toHaveLength(2);
    expect(screen.getAllByLabelText("Name")[0]).toHaveValue("Café du Centre");
  });

  it("adds a place and writes what is typed into the form", async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    await user.click(await screen.findByRole("button", { name: "Add place" }));
    const names = screen.getAllByLabelText("Name");
    expect(names).toHaveLength(2);

    await user.type(names[1], "Le Bistrot");

    expect(latest?.places?.[1].name).toBe("Le Bistrot");
  });

  it("removes a place but never the last one", async () => {
    const user = userEvent.setup();
    render(
      <TestForm
        places={[
          { name: "A", address: "", url: "" },
          { name: "B", address: "", url: "" },
        ]}
      />,
    );

    const removeButtons = await screen.findAllByRole("button", {
      name: "Remove place",
    });
    await user.click(removeButtons[0]);

    expect(screen.getAllByTestId("place-row")).toHaveLength(1);
    expect(screen.getByLabelText("Name")).toHaveValue("B");
    expect(screen.getByRole("button", { name: "Remove place" })).toBeDisabled();
  });

  it("stops offering places at the limit", async () => {
    render(
      <TestForm
        places={Array.from({ length: MAX_POLL_PLACES }, (_, i) => ({
          name: `Place ${i}`,
          address: "",
          url: "",
        }))}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "Add place" }),
    ).toBeDisabled();
  });
});
