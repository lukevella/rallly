import "server-only";
import { env } from "@/env";
import { isBillingEnabled } from "@/features/billing/constants";
import { isCalendarsEnabled } from "@/features/calendars/constants";
import { isEventTypesEnabled } from "@/features/event-types/constants";
import { isFeedbackEnabled } from "@/features/feedback/constants";
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
  registration: isEmailLoginEnabled && isRegistrationEnabled,
  calendars: isCalendarsEnabled,
  eventTypes: isEventTypesEnabled,
};
