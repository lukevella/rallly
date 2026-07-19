"use server";

import { APIError } from "better-auth";
import { cookies, headers } from "next/headers";
import { env } from "@/env";
import { getRegistrationEnabled } from "@/features/instance-settings/data";
import { authLib } from "@/lib/auth";

type SendLoginOtpResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "CAPTCHA_FAILED"
        | "EMAIL_BLOCKED"
        | "TEMPORARY_EMAIL_NOT_ALLOWED"
        | "BANNED_USER"
        | "UNKNOWN";
    };

async function verifyCaptcha(token?: string) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  // Fails closed: an unreachable or slow siteverify endpoint rejects the
  // attempt instead of hanging the request or skipping the check.
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token ?? "",
        }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      return false;
    }

    const outcome = (await res.json()) as { success: boolean };
    return outcome.success;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Sends the OTP for the combined login/registration flow. When registration
 * is enabled a "sign-in" OTP is sent for every non-credential email, so
 * verifying either signs into an existing account or creates one — the
 * response is identical for known and unknown emails. When registration is
 * disabled an "email-verification" OTP is sent instead, which better-auth
 * silently skips for unknown emails.
 *
 * Runs server-side so the captcha can be enforced for this surface only —
 * the better-auth captcha plugin would require a token from every caller of
 * the send endpoint, including event RSVP.
 */
export async function sendLoginOtp({
  email,
  captchaToken,
}: {
  email: string;
  captchaToken?: string;
}): Promise<SendLoginOtpResult> {
  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, code: "CAPTCHA_FAILED" };
  }

  const isRegistrationEnabled = await getRegistrationEnabled();

  try {
    await authLib.api.sendVerificationOTP({
      body: {
        email,
        type: isRegistrationEnabled ? "sign-in" : "email-verification",
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      const code = (error.body as { code?: string } | undefined)?.code;
      if (
        code === "EMAIL_BLOCKED" ||
        code === "TEMPORARY_EMAIL_NOT_ALLOWED" ||
        code === "BANNED_USER"
      ) {
        return { ok: false, code };
      }
    }
    console.error(error);
    return { ok: false, code: "UNKNOWN" };
  }

  const cookieStore = await cookies();
  cookieStore.set("verification-email", email, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://"),
    sameSite: "lax",
    maxAge: 15 * 60,
  });

  return { ok: true };
}
