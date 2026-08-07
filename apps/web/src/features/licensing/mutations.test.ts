import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockTransaction, mockDeleteMany, mockCreate } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    $transaction: mockTransaction,
    instanceLicense: {
      deleteMany: mockDeleteMany,
      create: mockCreate,
    },
  },
}));
// setInstanceLicense doesn't touch either, but importing the module pulls in
// LicenseManager (env) and createLicenseCheckoutSession (billing).
vi.mock("@/env", () => ({ env: {} }));
vi.mock("@rallly/billing", () => ({}));

const license = {
  key: "RLYV4-AAAA-BBBB-CCCC-DDDD-00199",
  licenseeName: "Probe Licensee",
  licenseeEmail: "probe@example.com",
  issuedAt: new Date("2026-01-01T00:00:00Z"),
  expiresAt: null,
  seats: 5,
  type: "PLUS" as const,
  whiteLabelAddon: false,
};

describe("setInstanceLicense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * An instance holds exactly one license. Activating a key used to call
   * create() directly, so re-entering the key already installed hit the
   * license_key unique index. Prisma's P2002 surfaced through safe-action's
   * handleServerError as a bare "INTERNAL_SERVER_ERROR" — the control panel
   * showed an internal-error toast even though the licensing API returned 200.
   */
  it("clears the existing license before inserting, so re-activating the same key cannot collide", async () => {
    const { setInstanceLicense } = await import("./mutations");
    await setInstanceLicense(license);

    expect(mockDeleteMany).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ licenseKey: license.key }),
    });

    // Both operations must be in one transaction, or a failed insert would
    // leave the instance with no license at all.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(2);
  });

  it("replaces a different installed key rather than accumulating rows", async () => {
    const { setInstanceLicense } = await import("./mutations");
    await setInstanceLicense({
      ...license,
      key: "RLYV4-ZZZZ-YYYY-XXXX-WWWW-99999",
    });

    // loadInstanceLicense reads the first row by id, so a stale row left
    // behind here would keep winning over the key just activated.
    expect(mockDeleteMany).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        licenseKey: "RLYV4-ZZZZ-YYYY-XXXX-WWWW-99999",
      }),
    });
  });
});

/**
 * A thrown fetch skips the response-status branch entirely, so before this was
 * handled a TLS failure behind a corporate proxy logged nothing and surfaced as
 * a bare "internal server error" — indistinguishable from the licensing service
 * being down. The codes below are the real ones Node reports; they were
 * captured by calling the corresponding badssl.com endpoints.
 */
describe("validateLicenseKey network failures", () => {
  const fetchError = (code: string) =>
    Object.assign(new TypeError("fetch failed"), { cause: { code } });

  async function attempt(thrown: unknown) {
    const { LicenseManager } = await import("./mutations");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(thrown);
    const manager = new LicenseManager({ apiUrl: "https://example.test/v1" });

    return manager
      .validateLicenseKey({ key: "RLYV4-AAAA-BBBB-CCCC-DDDD-00199" })
      .then(
        () => null,
        (error: Error) => error,
      );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["DEPTH_ZERO_SELF_SIGNED_CERT"],
    ["SELF_SIGNED_CERT_IN_CHAIN"],
    ["CERT_HAS_EXPIRED"],
    ["ERR_TLS_CERT_ALTNAME_INVALID"],
  ])("names the certificate as the cause for %s", async (code) => {
    const error = await attempt(fetchError(code));

    // The remedy has to reach the operator: the toast is generic, so the
    // message is the only place the CA hint can live.
    expect(error?.message).toContain("NODE_EXTRA_CA_CERTS");
  });

  it("does not blame certificates for a DNS failure", async () => {
    const error = await attempt(fetchError("ENOTFOUND"));

    expect(error?.message).toContain("Could not reach");
    expect(error?.message).not.toContain("NODE_EXTRA_CA_CERTS");
  });

  it("reports a timeout distinctly", async () => {
    const timeout = new DOMException("aborted due to timeout", "TimeoutError");
    const error = await attempt(timeout);

    expect(error?.message).toContain("did not respond");
    expect(error?.message).not.toContain("NODE_EXTRA_CA_CERTS");
  });

  it("rethrows errors it cannot classify rather than mislabelling them", async () => {
    const bug = new RangeError("something else entirely");
    const error = await attempt(bug);

    expect(error).toBe(bug);
  });

  it("rethrows a TypeError that isn't a transport failure", async () => {
    // A malformed LICENSE_API_URL throws this exact shape. Treating it as a
    // network failure would send an operator to debug connectivity when the
    // problem is their configuration.
    const badUrl = Object.assign(
      new TypeError("Failed to parse URL from not-a-url/v1"),
      { cause: { code: "ERR_INVALID_URL" } },
    );
    const error = await attempt(badUrl);

    expect(error).toBe(badUrl);
  });
});
