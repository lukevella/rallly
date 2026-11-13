import "server-only";

import { sendApiPollQuotaWarningEmail } from "@rallly/emails/templates/api-poll-quota-warning";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { Effect } from "effect";
import { getInstanceBranding } from "@/emails/branding";
import {
  QueuedEmailFailed,
  QueuedEmailSkipped,
} from "@/features/email-queue/service";
import { formatDate } from "@/lib/datetime/format";
import { getApiPollQuotaWarningContext } from "../data";
import { getQuotaWarningLevel, toMonthKey } from "../utils";

type QuotaWarningLevel = NonNullable<ReturnType<typeof getQuotaWarningLevel>>;

function parseQuotaWarningSubject(subjectId: string) {
  const [spaceId, month, level] = subjectId.split(":");
  if (
    !spaceId ||
    !month ||
    !/^\d{4}-\d{2}$/.test(month) ||
    (level !== "near_limit" && level !== "at_limit")
  ) {
    return null;
  }
  return { spaceId, month, level: level as QuotaWarningLevel };
}

const failWith = (message: string) => () => new QueuedEmailFailed({ message });

/**
 * Sends the warning queued by `queueApiPollQuotaWarning`. The subject is
 * `<spaceId>:<YYYY-MM>:<level>`; usage is read again at send time, so a
 * warning the space no longer warrants is skipped.
 */
export const sendApiPollQuotaWarning = Effect.fn(
  "apiPollQuota.sendApiPollQuotaWarning",
)(function* ({ subjectId }: { id: string; subjectId: string }) {
  const subject = parseQuotaWarningSubject(subjectId);
  if (!subject) {
    return yield* new QueuedEmailSkipped({ reason: "Malformed subject" });
  }

  const now = new Date();
  if (subject.month !== toMonthKey(now)) {
    return yield* new QueuedEmailSkipped({ reason: "The month has ended" });
  }

  const context = yield* Effect.tryPromise({
    try: () => getApiPollQuotaWarningContext({ spaceId: subject.spaceId, now }),
    catch: failWith("Failed to load the quota"),
  });
  if (!context) {
    return yield* new QueuedEmailSkipped({ reason: "Space no longer exists" });
  }
  const { owner } = context;
  if (owner.deletedAt) {
    return yield* new QueuedEmailSkipped({ reason: "Owner no longer exists" });
  }
  if (owner.banned) {
    return yield* new QueuedEmailSkipped({ reason: "Owner is banned" });
  }

  const currentLevel = getQuotaWarningLevel({
    count: context.used,
    limit: context.limit,
  });
  if (
    !currentLevel ||
    (subject.level === "at_limit" && currentLevel !== "at_limit")
  ) {
    return yield* new QueuedEmailSkipped({
      reason: "Usage is below this warning level",
    });
  }

  const branding = yield* Effect.tryPromise({
    try: () => getInstanceBranding(),
    catch: failWith("Failed to load branding"),
  });

  const locale = owner.locale ?? "en";

  // The mailer logs and swallows transport failures, so its result is what
  // tells a sent email from a failed one.
  const sent = yield* Effect.tryPromise({
    try: () =>
      sendApiPollQuotaWarningEmail({
        to: owner.email,
        locale,
        branding,
        props: {
          level: subject.level,
          spaceName: context.spaceName,
          used: context.used,
          limit: context.limit,
          resetDate: formatDate(context.resetAt, { locale }),
          settingsUrl: absoluteUrl("/settings/api-keys"),
        },
      }),
    catch: failWith("Failed to send the API poll quota warning email"),
  });
  if (!sent) {
    return yield* new QueuedEmailFailed({ message: "Transport failed" });
  }
});
