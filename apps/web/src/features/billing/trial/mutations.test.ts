import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncSpaceTier } from "@/features/billing/mutations";
import { endExpiredTrials, startSpaceTrial } from "./mutations";

type FakeSpace = {
  id: string;
  tier: "hobby" | "pro";
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  showBranding: boolean;
  hideAttribution: boolean;
};

type FakeSubscription = { id: string; spaceId: string; active: boolean };

// An in-memory stand-in for the rows these mutations touch. It evaluates
// the where clauses it is given, so the tests exercise the trial rules
// rather than the shape of the queries; an unknown filter throws so a query
// change cannot pass by accident.
const { db, client } = vi.hoisted(() => {
  const db = {
    spaces: [] as FakeSpace[],
    subscriptions: [] as FakeSubscription[],
    invites: [] as { spaceId: string }[],
  };

  const activeSubscriptions = (spaceId: string) =>
    db.subscriptions.filter((s) => s.spaceId === spaceId && s.active);

  const matches = (space: FakeSpace, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, condition]) => {
      switch (key) {
        case "id":
        case "tier":
          return space[key] === condition;
        case "trialStartedAt":
          if (condition !== null) throw new Error("unsupported filter");
          return space.trialStartedAt === null;
        case "trialEndsAt": {
          const { lte } = condition as { lte: Date };
          return space.trialEndsAt !== null && space.trialEndsAt <= lte;
        }
        case "subscriptions": {
          const { none } = condition as { none: { active: true } };
          if (none.active !== true) throw new Error("unsupported filter");
          return activeSubscriptions(space.id).length === 0;
        }
        default:
          throw new Error(`unsupported filter: ${key}`);
      }
    });

  const client = {
    space: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const space = db.spaces.find((s) => s.id === where.id);
        return space
          ? { ...space, subscriptions: activeSubscriptions(space.id) }
          : null;
      },
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        db.spaces.filter((s) => matches(s, where)).map((s) => ({ id: s.id })),
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeSpace>;
      }) => {
        const space = db.spaces.find((s) => s.id === where.id);
        if (!space) throw new Error("not found");
        Object.assign(space, data);
        return space;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Partial<FakeSpace>;
      }) => {
        const rows = db.spaces.filter((s) => matches(s, where));
        for (const row of rows) Object.assign(row, data);
        return { count: rows.length };
      },
    },
    subscription: {
      findFirst: async ({
        where,
      }: {
        where: { spaceId: string; active: true };
      }) => activeSubscriptions(where.spaceId)[0] ?? null,
    },
    spaceMemberInvite: {
      deleteMany: async ({ where }: { where: { spaceId: string } }) => {
        const before = db.invites.length;
        db.invites = db.invites.filter((i) => i.spaceId !== where.spaceId);
        return { count: before - db.invites.length };
      },
    },
  };

  return { db, client };
});

vi.mock("@rallly/database", () => ({
  prisma: {
    ...client,
    $transaction: (fn: (tx: typeof client) => unknown) => fn(client),
  },
}));

vi.mock("@/features/billing/service", () => ({ getStripe: vi.fn() }));

const NOW = new Date("2026-10-08T09:30:00Z");
const DAY = 24 * 60 * 60 * 1000;

function addSpace(overrides: Partial<FakeSpace> & { id: string }) {
  const space: FakeSpace = {
    tier: "hobby",
    trialStartedAt: null,
    trialEndsAt: null,
    showBranding: false,
    hideAttribution: false,
    ...overrides,
  };
  db.spaces.push(space);
  return space;
}

function addSubscription(spaceId: string, active: boolean) {
  db.subscriptions.push({ id: `sub_${spaceId}`, spaceId, active });
}

const space = (id: string) => db.spaces.find((s) => s.id === id);

beforeEach(() => {
  db.spaces = [];
  db.subscriptions = [];
  db.invites = [];
});

describe("startSpaceTrial", () => {
  it("starts a 14-day trial on an eligible space and makes it pro", async () => {
    addSpace({ id: "s1" });

    const result = await startSpaceTrial({ spaceId: "s1", now: NOW });

    const endsAt = new Date("2026-10-22T09:30:00Z");
    expect(result).toEqual({ started: true, endsAt });
    expect(space("s1")).toMatchObject({
      tier: "pro",
      trialStartedAt: NOW,
      trialEndsAt: endsAt,
    });
  });

  it("starts only once per space", async () => {
    addSpace({ id: "s1" });

    await startSpaceTrial({ spaceId: "s1", now: NOW });
    const second = await startSpaceTrial({
      spaceId: "s1",
      now: new Date(NOW.getTime() + DAY),
    });

    expect(second).toEqual({ started: false, reason: "trial_already_used" });
    expect(space("s1")?.trialStartedAt).toEqual(NOW);
  });

  it("lets only one of two simultaneous presses through", async () => {
    addSpace({ id: "s1" });

    const results = await Promise.all([
      startSpaceTrial({ spaceId: "s1", now: NOW }),
      startSpaceTrial({ spaceId: "s1", now: new Date(NOW.getTime() + 1) }),
    ]);

    expect(results.filter((r) => r.started)).toHaveLength(1);
    expect(results.filter((r) => !r.started)).toEqual([
      { started: false, reason: "trial_already_used" },
    ]);
    expect(space("s1")?.trialStartedAt).toEqual(NOW);
  });

  it("refuses a space whose trial has already ended", async () => {
    addSpace({
      id: "s1",
      trialStartedAt: new Date(NOW.getTime() - 30 * DAY),
      trialEndsAt: new Date(NOW.getTime() - 16 * DAY),
    });

    const result = await startSpaceTrial({ spaceId: "s1", now: NOW });

    expect(result).toEqual({ started: false, reason: "trial_already_used" });
    expect(space("s1")?.tier).toBe("hobby");
  });

  it("refuses a space that is already pro", async () => {
    addSpace({ id: "s1", tier: "pro" });

    const result = await startSpaceTrial({ spaceId: "s1", now: NOW });

    expect(result).toEqual({ started: false, reason: "already_pro" });
    expect(space("s1")?.trialStartedAt).toBeNull();
  });

  it("refuses a space with an active subscription", async () => {
    addSpace({ id: "s1", tier: "pro" });
    addSubscription("s1", true);

    const result = await startSpaceTrial({ spaceId: "s1", now: NOW });

    expect(result).toEqual({ started: false, reason: "subscription_active" });
    expect(space("s1")?.trialStartedAt).toBeNull();
  });

  it("allows a space whose only subscription has lapsed", async () => {
    addSpace({ id: "s1" });
    addSubscription("s1", false);

    const result = await startSpaceTrial({ spaceId: "s1", now: NOW });

    expect(result.started).toBe(true);
  });

  it("refuses a space that does not exist", async () => {
    const result = await startSpaceTrial({ spaceId: "missing", now: NOW });

    expect(result).toEqual({ started: false, reason: "space_not_found" });
  });
});

describe("endExpiredTrials", () => {
  it("moves a space whose trial ended back to hobby", async () => {
    addSpace({
      id: "ended",
      tier: "pro",
      trialStartedAt: new Date(NOW.getTime() - 15 * DAY),
      trialEndsAt: new Date(NOW.getTime() - DAY),
      showBranding: true,
      hideAttribution: true,
    });
    db.invites.push({ spaceId: "ended" });

    const ended = await endExpiredTrials({ now: NOW });

    expect(ended).toEqual(["ended"]);
    // The same downgrade as a lapsed subscription; the dates stay, so the
    // space cannot start another trial.
    expect(space("ended")).toMatchObject({
      tier: "hobby",
      showBranding: false,
      hideAttribution: false,
      trialStartedAt: new Date(NOW.getTime() - 15 * DAY),
      trialEndsAt: new Date(NOW.getTime() - DAY),
    });
    expect(db.invites).toHaveLength(0);
  });

  it("leaves a space that bought pro during its trial", async () => {
    addSpace({
      id: "bought",
      tier: "pro",
      trialStartedAt: new Date(NOW.getTime() - 15 * DAY),
      trialEndsAt: new Date(NOW.getTime() - DAY),
    });
    addSubscription("bought", true);

    const ended = await endExpiredTrials({ now: NOW });

    expect(ended).toEqual([]);
    expect(space("bought")?.tier).toBe("pro");
  });

  it("leaves a trial that is still running", async () => {
    addSpace({
      id: "running",
      tier: "pro",
      trialStartedAt: new Date(NOW.getTime() - 3 * DAY),
      trialEndsAt: new Date(NOW.getTime() + 11 * DAY),
    });

    const ended = await endExpiredTrials({ now: NOW });

    expect(ended).toEqual([]);
    expect(space("running")?.tier).toBe("pro");
  });

  it("leaves spaces that never had a trial", async () => {
    addSpace({ id: "free" });
    addSpace({ id: "paid", tier: "pro" });
    addSubscription("paid", true);

    const ended = await endExpiredTrials({ now: NOW });

    expect(ended).toEqual([]);
    expect(space("free")?.tier).toBe("hobby");
    expect(space("paid")?.tier).toBe("pro");
  });
});

describe("syncSpaceTier during a trial", () => {
  it("keeps the space pro when a subscription is cancelled mid-trial", async () => {
    addSpace({
      id: "s1",
      tier: "pro",
      trialStartedAt: new Date(NOW.getTime() - 5 * DAY),
      trialEndsAt: new Date(NOW.getTime() + 9 * DAY),
    });
    addSubscription("s1", false);

    const tier = await syncSpaceTier(client as never, "s1", NOW);

    expect(tier).toBe("pro");
    expect(space("s1")?.tier).toBe("pro");
  });

  it("moves the space to hobby when the cancelled subscription outlives the trial", async () => {
    addSpace({
      id: "s1",
      tier: "pro",
      trialStartedAt: new Date(NOW.getTime() - 20 * DAY),
      trialEndsAt: new Date(NOW.getTime() - 6 * DAY),
    });
    addSubscription("s1", false);

    const tier = await syncSpaceTier(client as never, "s1", NOW);

    expect(tier).toBe("hobby");
  });
});
