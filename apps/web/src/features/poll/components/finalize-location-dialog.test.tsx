import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";

const mocks = vi.hoisted(() => ({
  action: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  poll: {
    id: "poll-1",
    allowTentativeVotes: true,
    options: [
      { id: "o-cafe", name: "Café du Centre", address: "12 rue de la Paix" },
      { id: "o-bistrot", name: "Le Bistrot", address: null },
    ],
  },
  participants: [
    { id: "p1", votes: [{ optionId: "o-bistrot", type: "yes" }] },
    { id: "p2", votes: [{ optionId: "o-bistrot", type: "yes" }] },
    { id: "p3", votes: [{ optionId: "o-cafe", type: "yes" }] },
  ],
}));

vi.mock("@/features/poll/actions", () => ({
  finalizeLocationPollAction: mocks.action,
}));
vi.mock("@/features/poll/client", () => ({
  usePoll: () => mocks.poll,
  useParticipants: () => ({ participants: mocks.participants }),
}));
vi.mock("@/features/poll/components/vote-summary-progress-bar", () => ({
  VoteSummaryProgressBar: () => null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@rallly/ui/sonner", () => ({
  toast: { error: mocks.toastError },
}));
// The adapter turns a safe-action result into the mutation's data; hand the
// action's result straight through.
vi.mock("@next-safe-action/adapter-tanstack-query", () => ({
  mutationOptions: (
    action: (input: unknown) => Promise<unknown>,
    options: object,
  ) => ({ mutationFn: (input: unknown) => action(input), ...options }),
}));

import { FinalizeLocationDialog } from "./finalize-location-dialog";

function setup() {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <FinalizeLocationDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { user, onOpenChange };
}

describe("FinalizeLocationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.action.mockResolvedValue({ ok: true });
  });

  it("lists the places by popularity and flags the top choice", async () => {
    setup();

    const places = await screen.findAllByTestId("finalize-place");
    expect(places).toHaveLength(2);
    // Two yes votes for the Bistrot against one for the Café.
    expect(places[0]).toHaveAttribute("value", "o-bistrot");
    expect(screen.getAllByText("Top choice")).toHaveLength(1);
    expect(screen.getByText("12 rue de la Paix")).toBeInTheDocument();
  });

  it("can't finalize before a place is chosen", async () => {
    setup();

    expect(
      await screen.findByRole("button", { name: "Finalize" }),
    ).toBeDisabled();
  });

  it("finalizes the chosen place, closes the dialog and refreshes the page", async () => {
    const { user, onOpenChange } = setup();

    await user.click(await screen.findByLabelText(/Café du Centre/));
    await user.click(screen.getByRole("button", { name: "Finalize" }));

    await waitFor(() =>
      expect(mocks.action).toHaveBeenCalledWith({
        pollId: "poll-1",
        optionId: "o-cafe",
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and says so when the poll can't be finalized", async () => {
    mocks.action.mockResolvedValue({ ok: false, reason: "notOpen" });
    const { user, onOpenChange } = setup();

    await user.click(await screen.findByLabelText(/Le Bistrot/));
    await user.click(screen.getByRole("button", { name: "Finalize" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("says so when the request fails", async () => {
    mocks.action.mockRejectedValue(new Error("network"));
    const { user } = setup();

    await user.click(await screen.findByLabelText(/Le Bistrot/));
    await user.click(screen.getByRole("button", { name: "Finalize" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
  });

  it("cancels without finalizing", async () => {
    const { user, onOpenChange } = setup();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.action).not.toHaveBeenCalled();
  });
});
