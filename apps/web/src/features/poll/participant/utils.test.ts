import { describe, expect, it } from "vitest";
import { resolveVoter } from "./utils";

const input = { name: "Mallory", email: "mallory@example.com" };
const guest = { isGuest: true, name: "Guest", email: "guest@example.com" };
const member = { isGuest: false, name: "Ada Lovelace", email: "ada@idp.test" };

describe("resolveVoter", () => {
  it("keeps what the voter typed when authentication is not required", () => {
    expect(resolveVoter({ requireAuth: false, user: guest, input })).toEqual({
      ok: true,
      ...input,
    });
  });

  it("refuses a guest when authentication is required", () => {
    expect(resolveVoter({ requireAuth: true, user: guest, input })).toEqual({
      ok: false,
      reason: "authRequired",
    });
  });

  it("takes the name and email from the signed-in user, not from the input", () => {
    expect(resolveVoter({ requireAuth: true, user: member, input })).toEqual({
      ok: true,
      name: "Ada Lovelace",
      email: "ada@idp.test",
    });
  });
});
