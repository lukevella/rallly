import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { JobTitleSelect } from "@/features/user/components/job-title-select";
import { render, screen, waitFor } from "@/test/test-utils";

/**
 * Mirrors how the setup form drives the picker: the parent owns the value and
 * feeds it straight back, so a mode derived from that value would collapse the
 * moment the typed text matched a picklist key.
 */
function Harness({ initial = null }: { initial?: string | null }) {
  const [value, setValue] = React.useState<string | null>(initial);
  return (
    <>
      <JobTitleSelect id="jobTitle" value={value} onValueChange={setValue} />
      <output data-testid="value">{value ?? "null"}</output>
    </>
  );
}

async function chooseOther(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: "Other" }));
}

describe("JobTitleSelect", () => {
  it("stores a picklist selection by key", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Recruiter" }));

    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("recruiter"),
    );
  });

  it("keeps the free text input mounted when the text matches a picklist key", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseOther(user);
    const input = screen.getByLabelText("Describe your role");
    await user.type(input, "sales");

    // The bug this guards: "sales" is a picklist key, so deriving the mode
    // from the value unmounted the input mid-keystroke and silently turned
    // the answer into the Sales picklist entry.
    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("sales"),
    );
    expect(screen.getByLabelText("Describe your role")).toHaveValue("sales");
  });

  it("falls back to the Other key when the free text is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseOther(user);
    const input = screen.getByLabelText("Describe your role");
    await user.type(input, "Practice manager");
    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("Practice manager"),
    );

    await user.clear(input);
    // waitFor, not a bare expect: clearing the input drives a state update in
    // the parent harness, and asserting before React flushes it made this
    // test fail intermittently under full-suite load.
    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("other"),
    );
    expect(screen.getByLabelText("Describe your role")).toBeInTheDocument();
  });

  it("opens in Other mode for a stored free-text value", () => {
    render(<Harness initial="Practice manager" />);

    expect(screen.getByLabelText("Describe your role")).toHaveValue(
      "Practice manager",
    );
  });

  it("clears the answer via the opt-out", async () => {
    const user = userEvent.setup();
    render(<Harness initial="recruiter" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Prefer not to say" }));

    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("null"),
    );
    expect(
      screen.queryByLabelText("Describe your role"),
    ).not.toBeInTheDocument();
  });
});
