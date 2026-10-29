import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const REDIRECT = "NEXT_REDIRECT";

const mockRedirect = vi.fn((url: string) => {
  throw Object.assign(new Error(REDIRECT), { digest: `${REDIRECT};${url}` });
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

const mockGetSessionState = vi.fn();
const mockGetActiveSpaceForUser = vi.fn();
const mockGetOwnedSpace = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSessionState: () => mockGetSessionState(),
}));

vi.mock("@/features/space/data", () => ({
  getActiveSpaceForUser: (userId: string) => mockGetActiveSpaceForUser(userId),
  getOwnedSpace: (userId: string) => mockGetOwnedSpace(userId),
  getSpaceSeatCount: vi.fn(),
  getTotalSeatsForSpace: vi.fn(),
}));

vi.mock("@/lib/pathname", () => ({
  getPathname: () => Promise.resolve("/polls"),
}));

const completeUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Jessie Smith",
  isGuest: false,
  banned: false,
  timeZone: "Europe/London",
  timeFormat: "hours12",
};

const authenticatedAs = (user: Record<string, unknown>) => {
  mockGetSessionState.mockResolvedValue({
    status: "authenticated",
    session: { user },
  });
};

// loadActiveSpace is React-cached, so each case needs a fresh module registry
// or the first call's result leaks into the next test.
const loadGate = async () => {
  vi.resetModules();
  const mod = await import("./loaders");
  return mod.loadActiveSpace;
};

describe("loadActiveSpace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the active space when the user has one", async () => {
    const space = { id: "space-1", name: "Personal" };
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue(space);

    const gate = await loadGate();

    await expect(gate()).resolves.toEqual(space);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /setup when the user owns no space at all", async () => {
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue(null);
    mockGetOwnedSpace.mockResolvedValue(null);

    const gate = await loadGate();

    await expect(gate()).rejects.toThrow(REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/setup"),
    );
  });

  // /setup bounces an owner straight back, so redirecting there would loop.
  it("throws when the user owns a space but none is active", async () => {
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue(null);
    mockGetOwnedSpace.mockResolvedValue({ id: "space-1" });

    const gate = await loadGate();

    await expect(gate()).rejects.toThrow("Space owner has no membership row");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /setup when the name is missing, before reading spaces", async () => {
    authenticatedAs({ ...completeUser, name: "" });

    const gate = await loadGate();

    await expect(gate()).rejects.toThrow(REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/setup"),
    );
    expect(mockGetActiveSpaceForUser).not.toHaveBeenCalled();
  });

  // Long-standing accounts predate the timeZone/timeFormat columns. Both
  // resolve without a stored value, so a null must not force onboarding.
  it.each([
    ["timeZone", { timeZone: undefined }],
    ["timeFormat", { timeFormat: undefined }],
    ["both", { timeZone: undefined, timeFormat: undefined }],
  ])("does not redirect to /setup when %s is missing", async (_label, patch) => {
    const space = { id: "space-1", name: "Personal" };
    authenticatedAs({ ...completeUser, ...patch });
    mockGetActiveSpaceForUser.mockResolvedValue(space);

    const gate = await loadGate();

    await expect(gate()).resolves.toEqual(space);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to /login for a guest", async () => {
    authenticatedAs({ ...completeUser, isGuest: true });

    const gate = await loadGate();

    await expect(gate()).rejects.toThrow(REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/login"),
    );
  });

  it("fails the render on an unreadable session instead of redirecting", async () => {
    mockGetSessionState.mockResolvedValue({ status: "error" });

    const gate = await loadGate();

    await expect(gate()).rejects.toThrow("Failed to read session");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

const loadOnboardingGate = async () => {
  vi.resetModules();
  const mod = await import("./loaders");
  return mod.loadOnboardingGate;
};

describe("loadOnboardingGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets a guest through without reading spaces", async () => {
    authenticatedAs({ ...completeUser, isGuest: true });

    const gate = await loadOnboardingGate();

    await expect(gate()).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockGetActiveSpaceForUser).not.toHaveBeenCalled();
  });

  it("lets a signed-out visitor through", async () => {
    mockGetSessionState.mockResolvedValue({ status: "unauthenticated" });

    const gate = await loadOnboardingGate();

    await expect(gate()).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("lets an onboarded user through", async () => {
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue({ id: "space-1" });

    const gate = await loadOnboardingGate();

    await expect(gate()).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // A guest who signs up from their poll is returned to it and would
  // otherwise never reach /setup.
  it("redirects a registered user with no space to /setup and back", async () => {
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue(null);
    mockGetOwnedSpace.mockResolvedValue(null);

    const gate = await loadOnboardingGate();

    await expect(gate()).rejects.toThrow(REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringMatching(/^\/setup\?redirectTo=%2Fpolls/),
    );
  });

  it("redirects a registered user with no name to /setup", async () => {
    authenticatedAs({ ...completeUser, name: "" });

    const gate = await loadOnboardingGate();

    await expect(gate()).rejects.toThrow(REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/setup"),
    );
  });

  // /setup bounces an owner straight back, so redirecting would loop.
  it("lets a user through who owns a space but has none active", async () => {
    authenticatedAs(completeUser);
    mockGetActiveSpaceForUser.mockResolvedValue(null);
    mockGetOwnedSpace.mockResolvedValue({ id: "space-1" });

    const gate = await loadOnboardingGate();

    await expect(gate()).resolves.toBeUndefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("throws for a banned user", async () => {
    authenticatedAs({ ...completeUser, banned: true });

    const gate = await loadOnboardingGate();

    await expect(gate()).rejects.toThrow();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
