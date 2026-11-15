import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({ kind: "location" }));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => ({ kind: mocks.kind }),
  useParticipants: () => ({ participants: [] }),
}));
vi.mock("@/features/poll/components/finalize-location-dialog", () => ({
  FinalizeLocationDialog: () => <div data-testid="location-dialog" />,
}));
// The date wizard pulls in billing, analytics and the tRPC client.
vi.mock("@rallly/posthog/client", () => ({ posthog: { capture: vi.fn() } }));
vi.mock("@/features/billing/client", () => ({
  primePayWall: vi.fn(),
  usePayWallStore: () => undefined,
}));
vi.mock("@/features/billing/components/pay-wall-dialog", () => ({
  PayWallDialog: () => null,
}));
vi.mock("@/trpc/client", () => ({ trpc: {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { FinalizePollDialog } from "./finalize-poll-dialog";

describe("FinalizePollDialog", () => {
  it("asks for a place, not a date, on a location poll", () => {
    mocks.kind = "location";

    render(<FinalizePollDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("location-dialog")).toBeInTheDocument();
  });
});
