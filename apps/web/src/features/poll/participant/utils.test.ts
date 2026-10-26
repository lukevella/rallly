import { describe, expect, it } from "vitest";
import { readOidcIdentity, resolveVoterIdentity } from "./utils";

const typed = { name: "Typed Name", email: "typed@example.com" };
const idp = { name: "Alice IdP", email: "alice@idp.test" };

describe("resolveVoterIdentity", () => {
  it("keeps the typed identity when OIDC is not required", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: false,
        user: { isGuest: true, ...idp },
        oidcIdentity: null,
        input: typed,
      }),
    ).toEqual({ ok: true, ...typed });
  });

  it("refuses a guest session when OIDC is required", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: true, name: "Guest", email: "guest@x.test" },
        oidcIdentity: null,
        input: typed,
      }),
    ).toEqual({ ok: false, reason: "authRequired" });
  });

  it("refuses a signed-in user without a linked OIDC account", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: false, ...idp },
        oidcIdentity: null,
        input: typed,
      }),
    ).toEqual({ ok: false, reason: "authRequired" });
  });

  it("uses the IdP name and email, ignoring typed and profile values, for an OIDC user", () => {
    expect(
      resolveVoterIdentity({
        requireOidc: true,
        user: { isGuest: false, name: "Edited", email: "edited@x.test" },
        oidcIdentity: idp,
        input: typed,
      }),
    ).toEqual({ ok: true, ...idp });
  });
});

describe("readOidcIdentity", () => {
  const paths = { name: "name", email: "email" };
  const token = (claims: object) =>
    `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;

  it("reads the configured claims", () => {
    expect(
      readOidcIdentity(token({ name: "Alice", email: "a@idp.test" }), paths),
    ).toEqual({ name: "Alice", email: "a@idp.test" });
  });

  it("follows nested claim paths", () => {
    expect(
      readOidcIdentity(token({ user: { display: "Alice" } }), {
        ...paths,
        name: "user.display",
      }),
    ).toEqual({ name: "Alice", email: null });
  });

  it("returns null claims for a missing or malformed token", () => {
    const none = { name: null, email: null };
    expect(readOidcIdentity(null, paths)).toEqual(none);
    expect(readOidcIdentity("garbage", paths)).toEqual(none);
    expect(readOidcIdentity("h.%%%.s", paths)).toEqual(none);
  });
});
