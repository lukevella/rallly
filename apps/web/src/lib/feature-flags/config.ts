import "server-only";
import { env } from "@/env";
import { isBillingEnabled } from "@/features/billing/constants";
import { isCalendarsEnabled } from "@/features/calendars/constants";
import { isEventTypesEnabled } from "@/features/event-types/constants";
import { isFeedbackEnabled } from "@/features/feedback/constants";
import { isQuickCreateEnabled } from "@/features/quick-create/constants";
import { isSelfHosted } from "@/lib/constants";
import type { FeatureFlagConfig } from "@/lib/feature-flags/types";
import { isStorageEnabled } from "@/lib/storage";

const isEmailLoginEnabled = env.EMAIL_LOGIN_ENABLED === "true";
const isRegistrationEnabled = env.REGISTRATION_ENABLED === "true";

export const featureFlagConfig: FeatureFlagConfig = {
  storage: isStorageEnabled,
  billing: isBillingEnabled,
  feedback: isFeedbackEnabled,
  emailLogin: isEmailLoginEnabled,
  // Both halves of the Turnstile pair are needed: the site key renders the
  // widget and the secret verifies its tokens. With only one set, captcha
  // is disabled rather than half working.
  captcha: !!env.TURNSTILE_SECRET_KEY && !!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  // Independent of emailLogin: an SSO-only instance still provisions accounts
  // on first sign-in, and the create hook in lib/auth.ts enforces this flag
  // on every path that mints an account, social callbacks included.
  registration: isRegistrationEnabled,
  calendars: isCalendarsEnabled,
  eventTypes: isEventTypesEnabled,
  // The new poll admin at /polls/[pollId] is dev-only until it reaches
  // feature parity with the legacy admin and cuts over.
  pollAdmin: env.NODE_ENV === "development",
  quickCreate: isQuickCreateEnabled,
  // Self-hosted runs one process, so a per-process counter is an exact rate
  // limit and Redis is not required. Cloud runs many short-lived instances,
  // where a per-process counter is no limit at all, so it must use KV.
  inProcessRateLimit: isSelfHosted,
  // The API launches cloud first; self-hosted gets it once the release
  // channel carries the API host and its docs.
  api: !isSelfHosted,
  // Webhooks ride on the API capability: the dispatcher cron runs on the
  // cloud deployment and the docs live with the API reference.
  webhooks: !isSelfHosted,
  // Cloud deploys continuously and is never behind a release; the check
  // exists for operators who pull images.
  updateCheck: isSelfHosted,
};
