const port = process.env.PORT || 3000;

const getVercelUrl = () => {
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null;
};

export function absoluteUrl(subpath = "") {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    getVercelUrl() ??
    `http://localhost:${port}`;
  const url = new URL(subpath, baseUrl);
  return url.href;
}

export function shortUrl(subpath = "") {
  const baseUrl = process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? absoluteUrl();
  const url = new URL(subpath, baseUrl);
  return url.href;
}
