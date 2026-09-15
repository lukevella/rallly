import { describe, expect, it } from "vitest";
import { isPublicAddress } from "./public-address";

describe("isPublicAddress", () => {
  it.each([
    "8.8.8.8",
    "93.184.216.34",
    "2606:4700::6810:84e5",
    "::ffff:93.184.216.34",
  ])("accepts %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "64:ff9b::7f00:1",
    "64:ff9b:1::c0a8:1",
    "not-an-ip",
  ])("rejects %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});
