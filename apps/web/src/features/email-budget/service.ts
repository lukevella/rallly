import "server-only";

import { Context, Data, Effect, Layer } from "effect";
import { createRatelimit } from "@/lib/rate-limit";
import {
  EMAIL_BUDGET_RECIPIENTS_PER_DAY,
  EMAIL_BUDGET_WINDOW,
} from "./constants";

/** The budget store could not be read or written. */
export class EmailBudgetUnavailable extends Data.TaggedError(
  "EmailBudgetUnavailable",
)<{ cause: unknown }> {}

// Module level so the in-memory fallback keeps its counts across requests.
const limiter = createRatelimit(
  EMAIL_BUDGET_RECIPIENTS_PER_DAY,
  EMAIL_BUDGET_WINDOW,
);

/**
 * Recipients left in a key's window, and spending them. With rate limiting
 * off there is no budget: every key has unlimited recipients left.
 */
export class EmailBudgetStore extends Context.Service<
  EmailBudgetStore,
  {
    remaining(key: string): Effect.Effect<number, EmailBudgetUnavailable>;
    consume(input: {
      key: string;
      points: number;
    }): Effect.Effect<void, EmailBudgetUnavailable>;
  }
>()("rallly/email-budget/EmailBudgetStore") {
  static readonly layer = Layer.succeed(
    EmailBudgetStore,
    EmailBudgetStore.of({
      remaining: (key) =>
        limiter
          ? Effect.tryPromise({
              try: () => limiter.remaining(key),
              catch: (cause) => new EmailBudgetUnavailable({ cause }),
            })
          : Effect.succeed(Number.POSITIVE_INFINITY),
      consume: ({ key, points }) =>
        limiter
          ? Effect.tryPromise({
              try: () => limiter.limit(key, { rate: points }),
              catch: (cause) => new EmailBudgetUnavailable({ cause }),
            }).pipe(Effect.asVoid)
          : Effect.void,
    }),
  );
}
