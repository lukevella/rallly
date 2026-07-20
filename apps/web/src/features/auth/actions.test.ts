import { beforeEach, describe, expect, it, vi } from "vitest";

const setPassword = vi.fn();
const getUserHasPassword = vi.fn();
const sendPasswordAddedEmail = vi.fn();

vi.mock("@/lib/auth", () => ({
  default: { api: { setPassword } },
}));
vi.mock("@/features/user/data", () => ({ getUserHasPassword }));
vi.mock("@rallly/emails/templates/password-added", () => ({
  sendPasswordAddedEmail,
}));
// Infra the action touches after the guard, irrelevant to what these two
// cases assert. authActionClient itself (via the rate-limit middleware)
// transitively imports @/env, which isn't configured for vitest, so the
// action body is tested through the setPasswordForUser export instead of
// invoking the wrapped safe-action directly — see actions.ts for why.
vi.mock("@/emails/branding", () => ({
  getInstanceBranding: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/posthog", () => ({ track: vi.fn() }));
vi.mock("@/i18n/server/get-locale", () => ({
  getLocale: vi.fn().mockResolvedValue("en"),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/server", () => ({
  after: vi.fn((fn: () => unknown) => fn()),
}));
// The wrapped action reads this flag; its real module imports @/env at load
// time. setPasswordForUser doesn't touch it, but importing actions.ts pulls
// the module graph in, so stub it.
vi.mock("@/lib/feature-flags/server", () => ({
  isFeatureEnabled: vi.fn().mockReturnValue(true),
}));
// actions.ts also defines setPasswordAction at module scope, which chains
// off authActionClient — that module transitively imports @/env via the
// rate-limit/KV client. Stub it so importing the module for
// setPasswordForUser doesn't require a full env.
const chainable = (): unknown =>
  new Proxy(() => chainable(), { get: () => () => chainable() });
vi.mock("@/lib/safe-action/server", () => ({
  authActionClient: chainable(),
  createRateLimitMiddleware: vi.fn(),
}));

describe("setPasswordForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to overwrite an existing password", async () => {
    getUserHasPassword.mockResolvedValue(true);

    const { setPasswordForUser } = await import("./actions");

    await expect(
      setPasswordForUser({
        user: { id: "user-1", email: "user@example.com", locale: undefined },
        password: "correct horse battery staple",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("sets the password when no credential account exists", async () => {
    getUserHasPassword.mockResolvedValue(false);

    const { setPasswordForUser } = await import("./actions");
    await setPasswordForUser({
      user: { id: "user-1", email: "user@example.com", locale: undefined },
      password: "correct horse battery staple",
    });

    expect(setPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { newPassword: "correct horse battery staple" },
      }),
    );
  });
});
