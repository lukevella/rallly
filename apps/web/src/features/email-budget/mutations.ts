import "server-only";

import { createLogger } from "@rallly/logger";
import { Effect } from "effect";
import type { SpaceTier } from "@/features/space/schema";
import { EMAIL_BUDGET_RECIPIENTS_PER_DAY } from "./constants";
import { EmailBudgetStore } from "./service";
import type { EmailBudgetKind } from "./types";

const logger = createLogger("email-budget");

/**
 * Spends one point per recipient of an email sent on a poll owner's behalf
 * and answers how many of them may be sent; the caller sends the first
 * `allowed` and skips the rest. Pro spaces are exempt; `tier` is the
 * resolved tier, so an instance without billing is never charged. Emails
 * the recipient asked for themselves (their own notifications, login codes,
 * account mail) are never charged. A store failure allows every send: the budget bounds
 * abuse, it is not a gate the product depends on.
 */
export const chargeEmailBudget = Effect.fn("emailBudget.chargeEmailBudget")(
  function* ({
    ownerId,
    tier,
    pollId,
    kind,
    recipients,
  }: {
    ownerId: string | null;
    tier: SpaceTier;
    pollId: string;
    kind: EmailBudgetKind;
    recipients: number;
  }) {
    if (recipients <= 0 || !ownerId || tier === "pro") {
      return { allowed: Math.max(0, recipients), skipped: 0 };
    }

    const store = yield* EmailBudgetStore;
    const key = `email-budget:${ownerId}`;
    const event = {
      ownerId,
      pollId,
      kind,
      tier,
      recipients,
      budget: EMAIL_BUDGET_RECIPIENTS_PER_DAY,
    };

    const allowed = yield* store.reserve({ key, points: recipients }).pipe(
      Effect.catchTag("EmailBudgetUnavailable", (error) =>
        Effect.sync(() => {
          logger.error(
            { ...event, error: error.cause },
            "Email budget unavailable, sending without it",
          );
          return recipients;
        }),
      ),
    );

    const skipped = recipients - allowed;
    if (skipped > 0) {
      logger.warn(
        { ...event, allowed, skipped, reason: "budget_exhausted" },
        "Email budget exhausted, skipping sends",
      );
    }

    return { allowed, skipped };
  },
);
