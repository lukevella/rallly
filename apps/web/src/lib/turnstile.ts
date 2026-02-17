import { env } from "@/env";

export async function verifyTurnstileToken(
  token: string | undefined,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) {
    return true;
  }

  if (!token) {
    return false;
  }

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
