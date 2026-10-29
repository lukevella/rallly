import { Form } from "@rallly/ui/form";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsFree } from "@/features/billing/client";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { PollSettingsFormData } from "@/features/poll/components/forms/types";
import { render, screen } from "@/test/test-utils";

vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("@/features/billing/client", () => ({
  useIsFree: vi.fn(() => false),
  showPayWall: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useIsFree).mockReturnValue(false);
});

function TestForm({
  enableComments = false,
  allowTentativeVotes = true,
  hasTentativeVotes = false,
  hasResponses = false,
}: {
  enableComments?: boolean;
  allowTentativeVotes?: boolean;
  hasTentativeVotes?: boolean;
  hasResponses?: boolean;
}) {
  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      enableComments,
      allowTentativeVotes,
      requireParticipantEmail: false,
      hideParticipants: false,
      hideScores: false,
      aggregateResultsOnly: false,
    },
  });
  return (
    <Form {...form}>
      <PollSettingsForm
        hasTentativeVotes={hasTentativeVotes}
        hasResponses={hasResponses}
      />
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

  describe("PollSettingsForm aggregate results setting", () => {
    it("is free and can be enabled before responses arrive", async () => {
      vi.mocked(useIsFree).mockReturnValue(true);
      const user = userEvent.setup();
      render(<TestForm />);
      const setting = screen.getByRole("switch", {
        name: /show aggregate results only/i,
      });
      expect(setting).not.toBeDisabled();
      await user.click(setting);
      expect(setting).toBeChecked();
    });

    it("locks after the first response", () => {
      render(<TestForm hasResponses />);
      expect(
        screen.getByRole("switch", { name: /show aggregate results only/i }),
      ).toBeDisabled();
      expect(
        screen.getByText(/locked after the first response/i),
      ).toBeInTheDocument();
    });
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
