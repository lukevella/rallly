import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { captureOne, deleteAllMessages } from "@rallly/test-helpers";
import { createUserInDb } from "./test-utils";

const unknownEmail = "otp-locale-unknown@example.com";
const existingEmail = "otp-locale-existing@example.com";

const germanSubject = "Bitte bestätige Deine E-Mail-Adresse";

// The OTP endpoint lives under /api, which the locale proxy skips, so the
// email language has to be resolved from the request (or the account) itself.
test.describe.serial(() => {
  test.beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [unknownEmail, existingEmail] } },
    });
    await prisma.verification.deleteMany({
      where: { identifier: { endsWith: "@example.com" } },
    });
  });

  test.beforeEach(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [unknownEmail, existingEmail] } },
    });
    await prisma.verification.deleteMany({
      where: { identifier: { endsWith: "@example.com" } },
    });
  });

  test("login code follows the locale cookie for an unknown address", async ({
    request,
  }) => {
    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      {
        data: { email: unknownEmail, type: "sign-in" },
        headers: { cookie: "rallly_locale=de" },
      },
    );
    expect(send.status()).toBe(200);

    const { email } = await captureOne(unknownEmail);
    expect(email.Subject).toBe(germanSubject);
  });

  test("login code follows accept-language when there is no cookie", async ({
    request,
  }) => {
    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      {
        data: { email: unknownEmail, type: "sign-in" },
        headers: { "accept-language": "de-DE,de;q=0.9" },
      },
    );
    expect(send.status()).toBe(200);

    const { email } = await captureOne(unknownEmail);
    expect(email.Subject).toBe(germanSubject);
  });

  test("login code follows the account language over the device", async ({
    request,
  }) => {
    const user = await createUserInDb({
      email: existingEmail,
      name: "Existing User",
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { locale: "de" },
    });

    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      {
        data: { email: existingEmail, type: "sign-in" },
        headers: { cookie: "rallly_locale=en", "accept-language": "en" },
      },
    );
    expect(send.status()).toBe(200);

    const { email } = await captureOne(existingEmail);
    expect(email.Subject).toBe(germanSubject);
  });
});
