const getVercelUrl = () => {
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null;
};

export function absoluteUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    getVercelUrl() ??
    "http://localhost:3000"
  );
}
