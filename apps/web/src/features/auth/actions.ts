"use server";
import { sendPasswordAddedEmail } from "@rallly/emails/templates/password-added";
import { headers } from "next/headers";
import { after } from "next/server";
import * as z from "zod";
import { getInstanceBranding } from "@/emails/branding";
import { passwordSchema } from "@/features/auth/schema";
import { getUserHasPassword } from "@/features/user/data";
import { getLocale } from "@/i18n/server/get-locale";
import authLib from "@/lib/auth";
import { AppError } from "@/lib/errors/app-error";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { track } from "@/lib/posthog";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

// Extracted from the action so it can be unit tested without going through
// authActionClient: the rate-limit middleware it wraps with transitively
// imports @/env (via the KV client), which isn't configured for unit tests.
export async function setPasswordForUser({
  user,
  password,
}: {
  user: { id: string; email: string; locale?: string };
  password: string;
}) {
  // Checked against the database, not the session: session snapshots are
  // frozen in secondary storage. Better-Auth's setPassword already refuses
  // to overwrite an existing credential (PASSWORD_ALREADY_SET); this guard is
  // defense in depth and returns a clean FORBIDDEN for the expected case.
  if (await getUserHasPassword(user.id)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "This account already has a password",
    });
  }

  await authLib.api.setPassword({
    body: { newPassword: password },
    headers: await headers(),
  });

  track({ id: user.id, isGuest: false }, { event: "password_set" });

  const locale = user.locale ?? (await getLocale());
  const branding = await getInstanceBranding();

  after(() =>
    sendPasswordAddedEmail({
      to: user.email,
      locale,
      branding,
      props: {},
    }),
  );
}

// The target user comes from the session, so this calls the Better-Auth
// endpoint directly rather than going through a mutation.
export const setPasswordAction = authActionClient
  .metadata({ actionName: "set_password" })
  .use(createRateLimitMiddleware(5, "1 h"))
  .inputSchema(z.object({ password: passwordSchema }))
  .action(async ({ ctx, parsedInput }) => {
    // The UI hides this behind the emailLogin flag; gate the action too so a
    // direct request can't set a password on an instance where password login
    // is disabled.
    if (!isFeatureEnabled("emailLogin")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Password login is not enabled",
      });
    }

    await setPasswordForUser({
      user: ctx.user,
      password: parsedInput.password,
    });
  });

// Other sessions are deliberately NOT revoked: adding a first credential is
// additive, and revoking would log out the legitimate user without helping
// them.
