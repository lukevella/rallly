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
