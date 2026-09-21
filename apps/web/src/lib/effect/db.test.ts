import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { DatabaseError, fromPrisma } from "./db";

describe("fromPrisma", () => {
  it("resolves to the thunk's value", async () => {
    const value = await Effect.runPromise(
      fromPrisma(() => Promise.resolve({ count: 3 })),
    );
    expect(value).toEqual({ count: 3 });
  });

  it("fails with DatabaseError carrying the rejection as cause", async () => {
    const rejection = new Error("connection refused");
    const error = await Effect.runPromise(
      Effect.flip(fromPrisma(() => Promise.reject(rejection))),
    );
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.cause).toBe(rejection);
  });

  it("defers the call until the effect runs", async () => {
    let calls = 0;
    const effect = fromPrisma(() => {
      calls++;
      return Promise.resolve(calls);
    });
    expect(calls).toBe(0);
    await Effect.runPromise(effect);
    await Effect.runPromise(effect);
    expect(calls).toBe(2);
  });
});
