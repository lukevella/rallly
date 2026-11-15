import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { render, screen, within } from "@/test/test-utils";

vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

const billing = vi.hoisted(() => ({ isFree: false, showPayWall: vi.fn() }));

vi.mock("@/features/billing/client", () => ({
  useIsFree: () => billing.isFree,
  showPayWall: billing.showPayWall,
}));

function TestForm({
  enableComments = false,
  allowTentativeVotes = true,
  hasTentativeVotes = false,
  requireParticipantEmail = false,
  maxYesVotesPerOption = null,
  minYesVotesPerOption = 0,
}: {
  enableComments?: boolean;
  allowTentativeVotes?: boolean;
  hasTentativeVotes?: boolean;
  requireParticipantEmail?: boolean;
  maxYesVotesPerOption?: number | null;
  minYesVotesPerOption?: number;
}) {
  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      enableComments,
      allowTentativeVotes,
      requireParticipantEmail,
      hideParticipants: false,
      hideScores: false,
      maxYesVotesPerOption,
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <PollSettingsForm
          hasTentativeVotes={hasTentativeVotes}
          minYesVotesPerOption={minYesVotesPerOption}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe("PollSettingsForm require email setting on a free space", () => {
  beforeEach(() => {
    billing.isFree = true;
    billing.showPayWall.mockClear();
  });

  afterEach(() => {
    billing.isFree = false;
  });

  it("switches on without the pay wall", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const emailSwitch = screen.getByRole("switch", { name: /require email/i });
    await user.click(emailSwitch);
    expect(emailSwitch).toBeChecked();
    expect(billing.showPayWall).not.toHaveBeenCalled();
  });

  it("switches off without the pay wall", async () => {
    const user = userEvent.setup();
    render(<TestForm requireParticipantEmail={true} />);
    const emailSwitch = screen.getByRole("switch", { name: /require email/i });
    await user.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();
    expect(billing.showPayWall).not.toHaveBeenCalled();
  });

  it("labels the advanced section as Pro instead of each setting", () => {
    render(<TestForm />);
    const advanced = screen.getByRole("group", { name: /advanced/i });
    expect(
      within(advanced).getByText("Unlock with Rallly Pro"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Unlock with Rallly Pro")).toHaveLength(1);
    expect(
      within(advanced).getByRole("switch", { name: /hide participant names/i }),
    ).toBeInTheDocument();
    expect(
      within(advanced).getByRole("switch", { name: /hide votes/i }),
    ).toBeInTheDocument();
  });

  it("keeps hide participant names behind the pay wall", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    await user.click(
      screen.getByRole("switch", { name: /hide participant names/i }),
    );
    expect(billing.showPayWall).toHaveBeenCalledWith(
      expect.objectContaining({ setting: "hideParticipants" }),
    );
  });
});

describe("PollSettingsForm comments setting", () => {
  it("shows comments off by default", () => {
    render(<TestForm />);
    expect(screen.getByRole("switch", { name: /comments/i })).not.toBeChecked();
  });

  it("can be switched on", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const commentsSwitch = screen.getByRole("switch", { name: /comments/i });
    await user.click(commentsSwitch);
    expect(commentsSwitch).toBeChecked();
  });

  it("reflects polls that already have comments enabled", () => {
    render(<TestForm enableComments={true} />);
    expect(screen.getByRole("switch", { name: /comments/i })).toBeChecked();
  });
});

describe("PollSettingsForm vote options setting", () => {
  it("offers all three answers by default", () => {
    render(<TestForm />);
    expect(
      screen.getByRole("combobox", { name: /vote options/i }),
    ).toHaveTextContent(/if need be/i);
  });

  it("reflects polls that are already yes/no only", () => {
    render(<TestForm allowTentativeVotes={false} />);
    const trigger = screen.getByRole("combobox", { name: /vote options/i });
    expect(trigger).toHaveTextContent(/yes/i);
    expect(trigger).not.toHaveTextContent(/if need be/i);
  });

  it("can be changed to a plain yes/no poll", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const trigger = screen.getByRole("combobox", { name: /vote options/i });
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Yes No" }));
    expect(trigger).toHaveTextContent(/yes/i);
    expect(trigger).not.toHaveTextContent(/if need be/i);
  });
});

describe("PollSettingsForm vote options lock", () => {
  it("stays editable while no response uses the tentative vote", () => {
    render(<TestForm />);
    expect(
      screen.getByRole("combobox", { name: /vote options/i }),
    ).not.toBeDisabled();
  });

  it("locks the answer set once a response uses the tentative vote", () => {
    render(<TestForm hasTentativeVotes={true} />);
    expect(
      screen.getByRole("combobox", { name: /vote options/i }),
    ).toBeDisabled();
  });

  it("stays editable on a yes/no poll that still holds tentative votes", () => {
    // Only turning the option off is locked. A poll already set to yes/no has
    // nothing left to strand, so switching it back on must stay available.
    render(<TestForm allowTentativeVotes={false} hasTentativeVotes={true} />);
    expect(
      screen.getByRole("combobox", { name: /vote options/i }),
    ).not.toBeDisabled();
  });

  it("says why it is locked", () => {
    render(<TestForm hasTentativeVotes={true} />);
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });
});

describe("PollSettingsForm place limit", () => {
  it("has no limit by default", () => {
    render(<TestForm />);
    expect(
      screen.getByRole("switch", { name: /limit places per option/i }),
    ).not.toBeChecked();
    expect(
      screen.queryByLabelText(/places per option/i, {
        selector: "input[type=number]",
      }),
    ).toBeNull();
  });

  it("proposes ten places when switched on", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    await user.click(
      screen.getByRole("switch", { name: /limit places per option/i }),
    );
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
  });

  it("never proposes fewer places than the yes votes an option holds", async () => {
    const user = userEvent.setup();
    render(<TestForm minYesVotesPerOption={14} />);
    await user.click(
      screen.getByRole("switch", { name: /limit places per option/i }),
    );
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(14);
    expect(input).toHaveAttribute("min", "14");
  });

  it("shows the stored limit", () => {
    render(<TestForm maxYesVotesPerOption={3} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(3);
  });

  it("takes the number typed in", async () => {
    const user = userEvent.setup();
    render(<TestForm maxYesVotesPerOption={3} />);
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "7");
    expect(input).toHaveValue(7);
  });

  it("asks for a number when the field is left empty", async () => {
    const user = userEvent.setup();
    render(<TestForm maxYesVotesPerOption={5} minYesVotesPerOption={4} />);
    await user.clear(screen.getByRole("spinbutton"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(
      await screen.findByText(/Enter a whole number of at least/),
    ).toBeInTheDocument();
  });
});
