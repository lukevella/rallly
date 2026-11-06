import { getIP } from "better-auth/api";
import { env } from "@/env";

/**
 * How the client address is read from proxy headers, shared by Better Auth
 * and our own rate limits so both key a visitor the same way. Vercel and the
 * bundled proxy set x-real-ip to a single address. An x-forwarded-for with
 * several entries is trusted only once TRUSTED_PROXIES names the hops to strip.
 */
export const ipAddressConfig = {
  ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
  trustedProxies: env.TRUSTED_PROXIES?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
};

/**
 * The client address of a request, or undefined when no trusted header names
 * one. Callers skip rate limits for an unknown address, so unrelated visitors
 * never share one bucket.
 */
export function getClientIp(headers: Headers) {
  return (
    getIP(headers, { advanced: { ipAddress: ipAddressConfig } }) ?? undefined
  );
}
