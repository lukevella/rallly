import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { render, screen } from "@/test/test-utils";

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
}: {
  enableComments?: boolean;
  allowTentativeVotes?: boolean;
  hasTentativeVotes?: boolean;
  requireParticipantEmail?: boolean;
}) {
  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      enableComments,
      allowTentativeVotes,
      requireParticipantEmail,
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
