import { expect, test } from "@playwright/test";

test("the checkout return endpoint rejects an anonymous caller", async ({
  request,
}) => {
  const res = await request.get(
    "/api/stripe/portal?session_id=cs_test_someone_elses_session",
    { maxRedirects: 0 },
  );

  expect(res.status()).toBe(307);
  expect(res.headers().location).toContain("/login");
  expect(res.headers().location).not.toContain("stripe.com");
});

test("the checkout return endpoint still requires a session id", async ({
  request,
}) => {
  const res = await request.get("/api/stripe/portal", { maxRedirects: 0 });
  expect(res.status()).toBe(400);
});
