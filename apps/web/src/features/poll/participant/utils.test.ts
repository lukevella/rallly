import { describe, expect, it } from "vitest";
import { resolveVoterIdentity } from "./utils";

const typed = { name: "Typed Name", email: "typed@example.com" };
const idp = { name: "Alice IdP", email: "alice@idp.test" };

describe("resolveVoterIdentity", () => {
  it("keeps the typed identity when OIDC is not required", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: false,
        user: { isGuest: true, ...idp },
        hasOidcAccount: false,
        input: typed,
      }),
    ).toEqual({ ok: true, ...typed });
  });

  it("refuses a guest session when OIDC is required", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: true, name: "Guest", email: "guest@x.test" },
        hasOidcAccount: false,
        input: typed,
      }),
    ).toEqual({ ok: false, reason: "authRequired" });
  });

  it("refuses a signed-in user without a linked OIDC account", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: false, ...idp },
        hasOidcAccount: false,
        input: typed,
      }),
    ).toEqual({ ok: false, reason: "authRequired" });
  });

  it("uses the IdP name and email, ignoring typed values, for an OIDC user", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: false, ...idp },
        hasOidcAccount: true,
        input: typed,
      }),
    ).toEqual({ ok: true, ...idp });
  });
});
