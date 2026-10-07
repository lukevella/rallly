import "server-only";

import { Context, Data, Effect, Layer } from "effect";
import { createBudget } from "@/lib/rate-limit";
import {
  EMAIL_BUDGET_RECIPIENTS_PER_DAY,
  EMAIL_BUDGET_WINDOW,
} from "./constants";

/** The budget store could not be read or written. */
export class EmailBudgetUnavailable extends Data.TaggedError(
  "EmailBudgetUnavailable",
)<{ cause: unknown }> {}

// Module level so the in-memory fallback keeps its counts across requests.
const budget = createBudget(
  EMAIL_BUDGET_RECIPIENTS_PER_DAY,
  EMAIL_BUDGET_WINDOW,
);

/**
 * Takes up to `points` from a key's allowance in one atomic step and
 * answers how many it got. With rate limiting off there is no allowance and
 * every reservation is granted in full.
 */
export class EmailBudgetStore extends Context.Service<
  EmailBudgetStore,
  {
    reserve(input: {
      key: string;
      points: number;
    }): Effect.Effect<number, EmailBudgetUnavailable>;
  }
>()("rallly/email-budget/EmailBudgetStore") {
  static readonly layer = Layer.succeed(
    EmailBudgetStore,
    EmailBudgetStore.of({
      reserve: ({ key, points }) =>
        budget
          ? Effect.tryPromise({
              try: () => budget.reserve(key, points),
              catch: (cause) => new EmailBudgetUnavailable({ cause }),
            })
          : Effect.succeed(points),
    }),
  );
}
