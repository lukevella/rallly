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
