export function absoluteUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : typeof window !== "undefined"
    ? window.origin
    : "http://localhost:3000";
}
