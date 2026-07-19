"use server";

import { APIError } from "better-auth";
import { cookies, headers } from "next/headers";
import { env } from "@/env";
import { authLib } from "@/lib/auth";

type SendRegistrationOtpResult =
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

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token ?? "",
      }),
    },
  );

  if (!res.ok) {
    return false;
  }

  const outcome = (await res.json()) as { success: boolean };
  return outcome.success;
}

/**
 * Sends the registration OTP server-side so the captcha can be enforced for
 * this surface only — the better-auth captcha plugin would require a token
 * from every caller of the send endpoint, including login and event RSVP.
 */
export async function sendRegistrationOtp({
  email,
  captchaToken,
}: {
  email: string;
  captchaToken?: string;
}): Promise<SendRegistrationOtpResult> {
  if (!(await verifyCaptcha(captchaToken))) {
    return { ok: false, code: "CAPTCHA_FAILED" };
  }

  try {
    await authLib.api.sendVerificationOTP({
      body: { email, type: "sign-in" },
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
