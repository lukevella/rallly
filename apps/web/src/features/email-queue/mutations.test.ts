import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

// `@/env` validates at import and refuses to run under jsdom; the handlers
// under test never read it.
vi.mock("@/env", () => ({ env: {} }));

import { attemptQueuedEmail } from "./mutations";
import type { QueuedEmailHandler } from "./service";
import {
  QueuedEmailFailed,
  QueuedEmailHandlers,
  QueuedEmailSkipped,
} from "./service";

function attemptWith(handler: QueuedEmailHandler, banned = false) {
  return Effect.runPromise(
    attemptQueuedEmail({
      id: "q_1",
      kind: "scheduled_event_invite",
      subjectId: "invite_1",
      attempts: 1,
      user: { banned },
    }).pipe(
      Effect.provide(
        Layer.succeed(
          QueuedEmailHandlers,
          QueuedEmailHandlers.of({ scheduled_event_invite: handler }),
        ),
      ),
    ),
  );
}

describe("attemptQueuedEmail", () => {
  it("reports a handled email as sent", async () => {
    expect(await attemptWith(() => Effect.void)).toEqual({ ok: true });
  });

  it("skips without calling the handler when the queuing account is banned", async () => {
    const handler = vi.fn(() => Effect.void);
    expect(await attemptWith(handler, true)).toEqual({
      ok: false,
      skip: true,
      reason: "Queued by a banned account",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("folds a skip and a failure into results", async () => {
    expect(
      await attemptWith(() => new QueuedEmailSkipped({ reason: "Gone" })),
    ).toEqual({ ok: false, skip: true, reason: "Gone" });
    expect(
      await attemptWith(() => new QueuedEmailFailed({ message: "SMTP 451" })),
    ).toEqual({ ok: false, skip: false, error: "SMTP 451" });
  });

  it("folds a handler that throws into a failed attempt", async () => {
    const result = await attemptWith(() =>
      Effect.sync(() => {
        throw new RangeError("Incorrect locale information provided");
      }),
    );
    expect(result).toEqual({
      ok: false,
      skip: false,
      error: "Incorrect locale information provided",
    });
  });
});
