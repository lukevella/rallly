import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { InviteByEmail } from "./invite-by-email";

const billing = vi.hoisted(() => ({ isFree: true }));

vi.mock("@/trpc/client", () => ({
  trpc: {
    polls: {
      invites: {
        list: {
          useQuery: () => ({
            data: [],
            isPending: false,
            isError: false,
            isFetching: false,
            refetch: vi.fn(),
          }),
        },
      },
    },
  },
}));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => ({ id: "abc", status: "open" }),
}));

vi.mock("@/features/user/client", () => ({
  useUser: () => ({ user: { id: "u1", isGuest: false, name: "Yana" } }),
}));

vi.mock("@/features/billing/client", () => ({
  useIsFree: () => billing.isFree,
  useProMonthlyPrice: () => "$7",
}));

vi.mock("@/features/poll/invite/actions", () => ({
  sendPollInviteAction: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: vi.fn(), isExecuting: false }),
}));

// jsdom has no ResizeObserver; the height animation is not under test.
vi.mock("@/components/animated-height", () => ({
  AnimatedHeight: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("InviteByEmail on a free space", () => {
  it("disables sending with the reason in place, never a pay wall", () => {
    billing.isFree = true;
    render(<InviteByEmail />);
    const field = screen.getByLabelText("Email address");
    const button = screen.getByRole("button", { name: "Send invite" });
    expect(field).toBeDisabled();
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(
      /Sending invites is part of Pro/,
    );
    expect(
      screen.getByRole("link", { name: /Upgrade to Pro/ }),
    ).toHaveAttribute("href", "/settings/billing");
  });

  it("lets a Pro space send", () => {
    billing.isFree = false;
    render(<InviteByEmail />);
    expect(screen.getByLabelText("Email address")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send invite" })).toBeEnabled();
    expect(
      screen.queryByText(/Sending invites is part of Pro/),
    ).not.toBeInTheDocument();
  });
});
