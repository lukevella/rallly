import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";

const email = "password-sign-up@example.com";

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
});

// No UI calls this endpoint. It must stay closed at the API: it is the one
// path that could attach a password to an address before its owner has
// verified it, and the OTP login would inherit that password.
test("the password sign-up endpoint is closed", async ({ request }) => {
  const signUp = await request.post("/api/better-auth/sign-up/email", {
    data: { email, password: "attacker-chosen-password", name: "Mallory" },
  });
  expect(signUp.status()).toBe(400);

  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).toBeNull();
});
