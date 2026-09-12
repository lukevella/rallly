import { expect, test } from "vitest";

import { recipientDomain } from "./send";

test("returns the domain of a bare address", () => {
  expect(recipientDomain("jessie@example.com")).toBe("example.com");
});

test("strips a display-name wrapper", () => {
  expect(recipientDomain("Jessie Smith <jessie@Example.com>")).toBe(
    "example.com",
  );
});

test("returns undefined when there is no domain", () => {
  expect(recipientDomain("not-an-address")).toBeUndefined();
});
