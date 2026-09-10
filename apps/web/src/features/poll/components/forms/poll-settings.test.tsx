import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { render, screen } from "@/test/test-utils";

vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("@/features/billing/client", () => ({
  useIsFree: () => false,
  showPayWall: vi.fn(),
}));

function TestForm({
  enableComments = false,
  allowTentativeVotes = true,
  hasTentativeVotes = false,
}: {
  enableComments?: boolean;
  allowTentativeVotes?: boolean;
  hasTentativeVotes?: boolean;
}) {
  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      enableComments,
      allowTentativeVotes,
      requireParticipantEmail: false,
      hideParticipants: false,
      hideScores: false,
    },
  });
  return (
    <Form {...form}>
      <PollSettingsForm hasTentativeVotes={hasTentativeVotes} />
    </Form>
  );
}

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

  it("says why it is locked", () => {
    render(<TestForm hasTentativeVotes={true} />);
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
  });
});
