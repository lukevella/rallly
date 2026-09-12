import { expect, test } from "vitest";

import { recipientDomains, scrubAddresses } from "./send";

test("returns the domain of a bare address", () => {
  expect(recipientDomains("jessie@example.com")).toEqual(["example.com"]);
});

test("strips a display-name wrapper and lowercases", () => {
  expect(recipientDomains("Jessie Smith <jessie@Example.com>")).toEqual([
    "example.com",
  ]);
});

test("returns one domain per recipient without leaking later addresses", () => {
  expect(recipientDomains("a@one.test,b@two.test; C <c@one.test>")).toEqual([
    "one.test",
    "two.test",
  ]);
});

test("returns nothing when there is no address", () => {
  expect(recipientDomains("not-an-address")).toEqual([]);
});

test("scrubs addresses out of SMTP replies", () => {
  expect(
    scrubAddresses(
      "550 5.1.1 <jessie@example.com>: Recipient address rejected: jessie@example.com",
    ),
  ).toBe("550 5.1.1 <[redacted]>: Recipient address rejected: [redacted]");
  expect(
    scrubAddresses('Rejected "support team"@example.com and a@b.test'),
  ).toBe("Rejected [redacted] and [redacted]");
  expect(scrubAddresses('Rejected "a\\"b"@example.com')).toBe(
    "Rejected [redacted]",
  );
  expect(scrubAddresses("connect ECONNREFUSED 127.0.0.1:1")).toBe(
    "connect ECONNREFUSED 127.0.0.1:1",
  );
});
