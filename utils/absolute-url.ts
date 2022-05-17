export function absoluteUrl() {
  return (
    process.env.BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000"
  );
}
