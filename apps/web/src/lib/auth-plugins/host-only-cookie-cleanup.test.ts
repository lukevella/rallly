import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_COOKIE_DOMAIN: ".rallly.test" },
}));

import { hostOnlyCookieCleanup } from "./host-only-cookie-cleanup";

const SESSION_TOKEN = "__Secure-better-auth.session_token";
const SESSION_DATA = "__Secure-better-auth.session_data";

const cookieAttributes = {
  domain: ".rallly.test",
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "lax",
};

async function runHandler({
  path,
  cookieHeader,
  responseSetCookie,
}: {
  path: string;
  cookieHeader?: string;
  responseSetCookie?: string;
}) {
  // biome-ignore lint/style/noNonNullAssertion: the plugin always defines this hook
  const { handler } = hostOnlyCookieCleanup.hooks!.after![0];

  const responseHeaders = new Headers();
  if (responseSetCookie) {
    responseHeaders.append("set-cookie", responseSetCookie);
  }

  const result = (await handler({
    path,
    headers: new Headers(cookieHeader ? { cookie: cookieHeader } : {}),
    context: {
      authCookies: {
        sessionToken: { name: SESSION_TOKEN, attributes: cookieAttributes },
        sessionData: { name: SESSION_DATA, attributes: cookieAttributes },
      },
      responseHeaders,
    },
    returnHeaders: true,
  } as never)) as { headers: Headers };

  return result.headers.getSetCookie();
}

describe("hostOnlyCookieCleanup", () => {
  it("does nothing when there is no new session and no shadowed cookie", async () => {
    const cookies = await runHandler({
      path: "/get-session",
      cookieHeader: `${SESSION_TOKEN}=abc.def`,
    });

    expect(cookies).toEqual([]);
  });

  it("clears host-only cookies when the session token is shadowed", async () => {
    const cookies = await runHandler({
      path: "/get-session",
      cookieHeader: `${SESSION_TOKEN}=; ${SESSION_TOKEN}=abc.def`,
    });

    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain(`${SESSION_TOKEN}=;`);
    expect(cookies[1]).toContain(`${SESSION_DATA}=;`);
  });

  it("clears host-only cookies when a response sets a new session token", async () => {
    const cookies = await runHandler({
      path: "/sign-in/email-otp",
      responseSetCookie: `${SESSION_TOKEN}=new.token; Max-Age=5184000; Domain=.rallly.test; Path=/; HttpOnly; Secure; SameSite=Lax`,
    });

    expect(cookies).toHaveLength(2);
  });

  it("always clears host-only cookies on sign-out", async () => {
    const cookies = await runHandler({ path: "/sign-out" });

    expect(cookies).toHaveLength(2);
  });

  describe("deletion cookie attributes", () => {
    // Next.js re-serializes better-auth's Set-Cookie headers on some
    // paths (the cookies() merge in route handlers and server actions)
    // and drops Max-Age: 0 on the floor — an empty-value cookie without
    // an expiry is a *session* cookie, so the "deletion" used to mint the
    // very host-only shadow it was meant to clear. Expires survives that
    // pipeline, so every deletion must carry both.
    it("carries Max-Age=0 and an epoch Expires, without a Domain", async () => {
      const cookies = await runHandler({ path: "/sign-out" });

      for (const cookie of cookies) {
        expect(cookie).toContain("Max-Age=0");
        expect(cookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
        expect(cookie).not.toContain("Domain=");
      }
    });
  });
});
