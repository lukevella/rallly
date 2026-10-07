import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));

import { chargeEmailBudget } from "./mutations";
import { EmailBudgetStore, EmailBudgetUnavailable } from "./service";

// Mirrors the real store: a reservation is granted what is left, and the
// whole request is counted against the key.
function stubStore(budget: number) {
  const spent = new Map<string, number>();
  const reserve = vi.fn(({ key, points }: { key: string; points: number }) =>
    Effect.sync(() => {
      const used = spent.get(key) ?? 0;
      spent.set(key, used + points);
      return Math.max(0, Math.min(points, budget - used));
    }),
  );
  const layer = Layer.succeed(
    EmailBudgetStore,
    EmailBudgetStore.of({ reserve }),
  );
  return { layer, reserve };
}

function charge(
  layer: Layer.Layer<EmailBudgetStore>,
  input: Partial<Parameters<typeof chargeEmailBudget>[0]> & {
    recipients: number;
  },
) {
  return Effect.runPromise(
    chargeEmailBudget({
      ownerId: "user_1",
      tier: "hobby",
      pollId: "poll_1",
      kind: "scheduled_event_invite",
      ...input,
    }).pipe(Effect.provide(layer)),
  );
}

describe("chargeEmailBudget", () => {
  it("charges one point per recipient against the poll owner", async () => {
    const store = stubStore(10);
    expect(await charge(store.layer, { recipients: 4 })).toEqual({
      allowed: 4,
      skipped: 0,
    });
    expect(store.reserve).toHaveBeenCalledWith({
      key: "email-budget:user_1",
      points: 4,
    });
  });

  it("skips the sends past the cap and charges only what it allows", async () => {
    const store = stubStore(10);
    await charge(store.layer, { recipients: 7 });
    expect(await charge(store.layer, { recipients: 5 })).toEqual({
      allowed: 3,
      skipped: 2,
    });
    expect(await charge(store.layer, { recipients: 1 })).toEqual({
      allowed: 0,
      skipped: 1,
    });
  });

  it("keeps a separate budget per owner, guests included", async () => {
    const store = stubStore(2);
    await charge(store.layer, { ownerId: "guest_1", recipients: 2 });
    expect(await charge(store.layer, { recipients: 2 })).toEqual({
      allowed: 2,
      skipped: 0,
    });
  });

  it("never charges a Pro space", async () => {
    const store = stubStore(0);
    expect(await charge(store.layer, { tier: "pro", recipients: 50 })).toEqual({
      allowed: 50,
      skipped: 0,
    });
    expect(store.reserve).not.toHaveBeenCalled();
  });

  it("allows every recipient when the reservation fails", async () => {
    const layer = Layer.succeed(
      EmailBudgetStore,
      EmailBudgetStore.of({
        reserve: () =>
          Effect.fail(new EmailBudgetUnavailable({ cause: "down" })),
      }),
    );
    expect(await charge(layer, { recipients: 3 })).toEqual({
      allowed: 3,
      skipped: 0,
    });
  });
});
