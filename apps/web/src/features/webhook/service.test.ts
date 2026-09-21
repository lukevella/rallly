import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AllowPrivateTargets,
  guardedLookup,
  PrivateAddressError,
  WebhookSendError,
  WebhookSender,
} from "./service";

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

describe("WebhookSender", () => {
  const PROXY_VARS = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"];
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = Object.fromEntries(
      PROXY_VARS.map((name) => [name, process.env[name]]),
    );
    for (const name of PROXY_VARS) {
      delete process.env[name];
    }
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

  function sendFailure(url: string) {
    return Effect.runPromise(
      WebhookSender.use((sender) =>
        sender.send({
          url,
          secret: "whsec_test",
          deliveryId: "d_1",
          eventType: "poll.closed",
          version: "2026-09-20",
          body: "{}",
        }),
      ).pipe(
        Effect.flip,
        Effect.provide(WebhookSender.layer),
        Effect.provideService(AllowPrivateTargets, false),
      ),
    );
  }

  it("refuses a malformed URL", async () => {
    const error = await sendFailure("not a url");
    expect(error).toBeInstanceOf(WebhookSendError);
    expect(error).toMatchObject({
      reason: "invalid_url",
      status: null,
      message: "Invalid webhook URL",
    });
  });

  it("refuses a plain http target", async () => {
    const error = await sendFailure("http://example.com/hook");
    expect(error).toMatchObject({
      reason: "insecure_target",
      status: null,
      message: "Webhook URL must use https",
    });
  });

  it("refuses a private IP literal before connecting", async () => {
    const error = await sendFailure("https://10.0.0.1/hook");
    expect(error).toMatchObject({
      reason: "private_address",
      status: null,
      message: "Webhook host is a private address",
    });
  });

  // Loopback is always exempt from the proxy, so with a proxy configured
  // this request takes the direct path — the one that must carry the
  // guarded lookup. Resolution fails before any socket opens, so the test
  // needs neither a proxy nor a listener.
  it("refuses a hostname that resolves to a private address on the direct path behind a proxy", async () => {
    process.env.HTTPS_PROXY = "http://proxy.invalid:3128";

    const error = await sendFailure("https://localhost/hook");
    expect(error).toMatchObject({
      reason: "private_address",
      status: null,
      message: "Webhook host resolves to a private address",
    });
  });
});
