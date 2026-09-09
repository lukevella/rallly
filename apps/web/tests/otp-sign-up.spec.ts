import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { deleteAllMessages, getCode } from "@rallly/test-helpers";
import { createUserInDb } from "./test-utils";

const unknownEmail = "otp-sign-up-unknown@example.com";
const existingEmail = "otp-sign-up-existing@example.com";

// The "sign-in" OTP type creates an account for an unknown address. The
// registration setting is enforced where the account would be created, so a
// valid code for an unknown address must still end without a user.
test.describe.serial(() => {
  test.beforeAll(async () => {
    await prisma.instanceSettings.update({
      where: { id: 1 },
      data: { disableUserRegistration: true },
    });
    await prisma.verification.deleteMany({
      where: { identifier: { endsWith: unknownEmail } },
    });
  });

  test.beforeEach(async () => {
    await deleteAllMessages();
  });

  test.afterAll(async () => {
    await prisma.instanceSettings.update({
      where: { id: 1 },
      data: { disableUserRegistration: false },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [unknownEmail, existingEmail] } },
    });
    await prisma.verification.deleteMany({
      where: { identifier: { endsWith: unknownEmail } },
    });
  });

  test("a verified code for an unknown address creates no account", async ({
    request,
  }) => {
    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      { data: { email: unknownEmail, type: "sign-in" } },
    );
    expect(send.status()).toBe(200);
    const otp = await getCode(unknownEmail);

    const verify = await request.post("/api/better-auth/sign-in/email-otp", {
      data: { email: unknownEmail, otp },
    });
    expect(verify.status(), await verify.text()).toBe(400);
    expect(await verify.json()).toMatchObject({ code: "SIGNUP_DISABLED" });

    const user = await prisma.user.findUnique({
      where: { email: unknownEmail },
    });
    expect(user).toBeNull();
  });

  test("an existing user still signs in with a code", async ({ request }) => {
    await createUserInDb({
      email: existingEmail,
      name: "Existing User",
      role: "user",
    });

    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      { data: { email: existingEmail, type: "sign-in" } },
    );
    expect(send.status()).toBe(200);

    const otp = await getCode(existingEmail);
    const verify = await request.post("/api/better-auth/sign-in/email-otp", {
      data: { email: existingEmail, otp },
    });
    expect(verify.status()).toBe(200);
  });
});
