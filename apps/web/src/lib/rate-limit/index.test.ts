import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));

import { createBudget } from "./index";

describe("createBudget", () => {
  it("grants what is left and nothing past it", async () => {
    const budget = createBudget(10, "24 h");
    expect(await budget?.reserve("a", 7)).toBe(7);
    expect(await budget?.reserve("a", 5)).toBe(3);
    expect(await budget?.reserve("a", 1)).toBe(0);
    expect(await budget?.reserve("b", 4)).toBe(4);
  });

  it("never grants more than the allowance to concurrent reservations", async () => {
    const budget = createBudget(10, "24 h");
    const grants = await Promise.all(
      Array.from({ length: 8 }, () => budget?.reserve("a", 3)),
    );
    expect(grants.reduce((sum = 0, n = 0) => sum + n, 0)).toBe(10);
  });
});
