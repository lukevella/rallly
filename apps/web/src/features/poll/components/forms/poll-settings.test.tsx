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

function TestForm({ enableComments = false }: { enableComments?: boolean }) {
  const form = useForm<PollSettingsFormData>({
    defaultValues: {
      enableComments,
      requireParticipantEmail: false,
      hideParticipants: false,
      hideScores: false,
    },
  });
  return (
    <Form {...form}>
      <PollSettingsForm />
    </Form>
  );
}

describe("PollSettingsForm comments setting", () => {
  it("shows comments off by default with a legacy badge and no hint", () => {
    render(<TestForm />);
    const commentsSwitch = screen.getByRole("switch", { name: /comments/i });
    expect(commentsSwitch).not.toBeChecked();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
    expect(
      screen.queryByText(/comments are being phased out/i),
    ).not.toBeInTheDocument();
  });

  it("reveals the phase out hint when comments are switched on", async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const commentsSwitch = screen.getByRole("switch", { name: /comments/i });
    await user.click(commentsSwitch);
    expect(commentsSwitch).toBeChecked();
    expect(
      screen.getByText(/participants can include a note with their response/i),
    ).toBeInTheDocument();
  });

  it("shows the hint immediately for polls that already have comments enabled", () => {
    render(<TestForm enableComments={true} />);
    expect(screen.getByRole("switch", { name: /comments/i })).toBeChecked();
    expect(
      screen.getByText(/comments are being phased out/i),
    ).toBeInTheDocument();
  });

  it("renders the phase out hint as an alert", () => {
    render(<TestForm enableComments={true} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /comments are being phased out/i,
    );
  });
});
