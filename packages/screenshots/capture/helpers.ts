import type { Page } from "@playwright/test";

const MAILPIT_API_URL = "http://localhost:8025/api";

async function getOtp(email: string, timeout = 10000): Promise<string> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_API_URL}/v1/messages`);
    const data = (await res.json()) as {
      messages: {
        ID: string;
        To: { Address: string }[];
        Read: boolean;
      }[];
    };

    const message = data.messages
      .reverse()
      .find((msg) => msg.To.some((r) => r.Address === email) && !msg.Read);

    if (message) {
      const full = await fetch(`${MAILPIT_API_URL}/v1/message/${message.ID}`);
      const msg = (await full.json()) as { Text: string };

      // Mark as read
      await fetch(`${MAILPIT_API_URL}/v1/messages`, {
        method: "PUT",
        body: JSON.stringify({ IDs: [message.ID], Read: true }),
      });

      const match = msg.Text.match(/\b(\d{6})\b/);
      if (match) return match[1];
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error(`No OTP email received for ${email} within ${timeout}ms`);
}

export async function loginWithEmail(page: Page, email: string) {
  await page.goto("/login");
  await page.getByText("Welcome").waitFor();

  await page.getByPlaceholder("jessie.smith@example.com").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();

  const otp = await getOtp(email);

  await page.getByRole("heading", { name: "Finish Logging In" }).waitFor();
  await page.getByPlaceholder("Enter your 6-digit code").fill(otp);

  await page.waitForLoadState("networkidle");
}

export function screenshotPath(name: string) {
  return `screenshots/${name}.png`;
}
