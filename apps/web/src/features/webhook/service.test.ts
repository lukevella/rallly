import { describe, expect, it } from "vitest";
import { guardedLookup, PrivateAddressError } from "./service";

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
