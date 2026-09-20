import { describe, expect, it } from "vitest";
import { webhookUrlSchema } from "./schema";

describe("webhookUrlSchema", () => {
  it.each([
    "https://example.com/hooks/rallly",
    "https://hooks.example.com:8443/path?x=1",
    "https://172.32.0.1/hook",
  ])("accepts %s", (url) => {
    expect(webhookUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    ["not a url", "not-a-url"],
    ["http", "http://example.com/hook"],
    ["ftp", "ftp://example.com/hook"],
    ["localhost", "https://localhost/hook"],
    ["localhost subdomain", "https://app.localhost/hook"],
    ["loopback", "https://127.0.0.1/hook"],
    ["ipv6 loopback", "https://[::1]/hook"],
    ["rfc1918 10/8", "https://10.1.2.3/hook"],
    ["rfc1918 172.16/12", "https://172.20.0.1/hook"],
    ["rfc1918 192.168/16", "https://192.168.0.10/hook"],
    ["link-local", "https://169.254.169.254/latest/meta-data"],
    ["ipv4-mapped", "https://[::ffff:10.0.0.1]/hook"],
    ["credentials", "https://user:pass@example.com/hook"],
  ])("rejects %s", (_label, url) => {
    expect(webhookUrlSchema.safeParse(url).success).toBe(false);
  });

  // A form resolver surfaces only the first issue, so the first issue has to
  // be the one that names the actual problem.
  it.each([
    ["http://example.com/hook", "Webhook URLs must use https"],
    ["https://localhost/hook", "Webhook URLs must point at a public host"],
    ["https://127.0.0.1/hook", "Webhook URLs must point at a public host"],
    [
      "https://user:pass@example.com/hook",
      "Webhook URLs must not contain credentials",
    ],
  ])("reports %s as %s", (url, message) => {
    const result = webhookUrlSchema.safeParse(url);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});
