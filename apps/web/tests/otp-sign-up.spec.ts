import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { captureOne, deleteAllMessages, getCode } from "@rallly/test-helpers";
import { createUserInDb } from "./test-utils";

const unknownEmail = "otp-sign-up-unknown@example.com";
const existingEmail = "otp-sign-up-existing@example.com";

// The "sign-in" OTP type creates an account for an unknown address. The
// registration setting only reaches the UI, so the API has to honour it.
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

  test("an unknown address gets no code and no account", async ({
    request,
  }) => {
    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      { data: { email: unknownEmail, type: "sign-in" } },
    );
    // Success without a message, so the response does not reveal whether
    // the address is registered.
    expect(send.status()).toBe(200);
    // The plugin writes the pending code before deciding whether to send it;
    // the gate answers before the plugin runs, so no row exists at all.
    const pending = await prisma.verification.findFirst({
      where: { identifier: `sign-in-otp-${unknownEmail}` },
    });
    expect(pending).toBeNull();
    await expect(captureOne(unknownEmail, { wait: 3000 })).rejects.toThrow();

    const verify = await request.post("/api/better-auth/sign-in/email-otp", {
      data: { email: unknownEmail, otp: "000000" },
    });
    expect(verify.status()).toBe(400);

    const user = await prisma.user.findUnique({
      where: { email: unknownEmail },
    });
    expect(user).toBeNull();
  });

  test("a code issued before registration closed cannot create an account", async ({
    request,
  }) => {
    await prisma.instanceSettings.update({
      where: { id: 1 },
      data: { disableUserRegistration: false },
    });
    const send = await request.post(
      "/api/better-auth/email-otp/send-verification-otp",
      { data: { email: unknownEmail, type: "sign-in" } },
    );
    expect(send.status()).toBe(200);
    const otp = await getCode(unknownEmail);

    await prisma.instanceSettings.update({
      where: { id: 1 },
      data: { disableUserRegistration: true },
    });
    // The send gate is out of the picture: the code is real. Only the
    // user.create hook stands between this call and a new account.
    const verify = await request.post("/api/better-auth/sign-in/email-otp", {
      data: { email: unknownEmail, otp },
    });
    expect(verify.status(), await verify.text()).toBe(403);

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
