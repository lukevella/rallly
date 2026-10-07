import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));

import { chargeEmailBudget } from "./mutations";
import { EmailBudgetStore, EmailBudgetUnavailable } from "./service";

function stubStore(budget: number) {
  const spent = new Map<string, number>();
  const consume = vi.fn(({ key, points }: { key: string; points: number }) =>
    Effect.sync(() => {
      spent.set(key, (spent.get(key) ?? 0) + points);
    }),
  );
  const layer = Layer.succeed(
    EmailBudgetStore,
    EmailBudgetStore.of({
      remaining: (key) =>
        Effect.succeed(Math.max(0, budget - (spent.get(key) ?? 0))),
      consume,
    }),
  );
  return { layer, consume, spent };
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
    expect(store.consume).toHaveBeenCalledWith({
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
    expect(store.spent.get("email-budget:user_1")).toBe(10);
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
    expect(store.consume).not.toHaveBeenCalled();
  });

  it("allows every send when the store is unavailable", async () => {
    const layer = Layer.succeed(
      EmailBudgetStore,
      EmailBudgetStore.of({
        remaining: () =>
          Effect.fail(new EmailBudgetUnavailable({ cause: "down" })),
        consume: () => Effect.void,
      }),
    );
    expect(await charge(layer, { recipients: 3 })).toEqual({
      allowed: 3,
      skipped: 0,
    });
  });
});
