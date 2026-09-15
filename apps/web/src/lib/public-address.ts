import "server-only";

import { BlockList, isIP } from "node:net";

// Loopback, link local (cloud metadata lives there), private, carrier grade
// NAT, benchmarking, multicast, reserved and unspecified. Anything an
// applicant's hostname resolves to must fall outside these before we fetch.
const nonPublicAddresses = new BlockList();
for (const [subnet, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const) {
  nonPublicAddresses.addSubnet(subnet, prefix, "ipv4");
}
for (const [subnet, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  nonPublicAddresses.addSubnet(subnet, prefix, "ipv6");
}

export function isPublicAddress(address: string) {
  // IPv4 mapped IPv6 (`::ffff:10.0.0.1`) is checked as the IPv4 it wraps.
  const mapped = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const candidate = mapped ? mapped[1] : address;
  const family = isIP(candidate);
  if (family === 0) return false;
  return !nonPublicAddresses.check(candidate, family === 4 ? "ipv4" : "ipv6");
}
