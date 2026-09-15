import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { guardedLookup, PrivateAddressError, sendWebhook } from "./service";

function lookupResult(hostname: string, all: boolean) {
  return new Promise<{ err: Error | null; address: unknown }>((resolve) => {
    guardedLookup(hostname, { all }, (err, address) =>
      resolve({ err, address }),
    );
  });
}

describe("guardedLookup", () => {
  it("refuses a name that resolves to loopback", async () => {
    const { err } = await lookupResult("localhost", false);
    expect(err).toBeInstanceOf(PrivateAddressError);
  });

  it("refuses a private IP literal", async () => {
    const { err } = await lookupResult("10.0.0.1", true);
    expect(err).toBeInstanceOf(PrivateAddressError);
  });

  it("hands back a public literal in the shape the caller asked for", async () => {
    const single = await lookupResult("8.8.8.8", false);
    expect(single.err).toBeNull();
    expect(single.address).toBe("8.8.8.8");

    const all = await lookupResult("8.8.8.8", true);
    expect(all.err).toBeNull();
    expect(all.address).toEqual([{ address: "8.8.8.8", family: 4 }]);
  });
});

describe("sendWebhook", () => {
  const PROXY_VARS = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"];
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(
      [...PROXY_VARS, "WEBHOOK_ALLOW_PRIVATE_URLS"].map((name) => [
        name,
        process.env[name],
      ]),
    );
    for (const name of PROXY_VARS) {
      delete process.env[name];
    }
    delete process.env.WEBHOOK_ALLOW_PRIVATE_URLS;
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  // Loopback is always exempt from the proxy, so with a proxy configured
  // this request takes the direct path — the one that must carry the
  // guarded lookup. Resolution fails before any socket opens, so the test
  // needs neither a proxy nor a listener.
  it("refuses a hostname that resolves to a private address on the direct path behind a proxy", async () => {
    process.env.HTTPS_PROXY = "http://proxy.invalid:3128";

    const result = await sendWebhook({
      url: "https://localhost/hook",
      secret: "whsec_test",
      deliveryId: "d_1",
      eventType: "poll.closed",
      body: "{}",
    });

    expect(result).toEqual({
      ok: false,
      status: null,
      error: "Webhook host resolves to a private address",
    });
  });
});
