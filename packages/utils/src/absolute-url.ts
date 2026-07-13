const port = process.env.PORT || 3000;

const getVercelUrl = () => {
  // Prefer `VERCEL_BRANCH_URL` — the stable per-branch alias Vercel links to from
  // PR comments and the dashboard. That is the URL users actually open, so the
  // base URL must match it or auth cookies/callbacks break cross-origin. Fall
  // back to the per-deployment `VERCEL_URL`. Both are server-only (not
  // `NEXT_PUBLIC_`), so this resolves only on the server; on the client we fall
  // back to `window.location.origin` below.
  const vercelUrl = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  return vercelUrl ? `https://${vercelUrl}` : null;
};

function joinPath(baseUrl: string, subpath = "") {
  if (subpath) {
    const url = new URL(subpath, baseUrl);
    return url.href;
  }

  return baseUrl;
}

export function absoluteUrl(
  subpath = "",
  query: { [key: string]: string | undefined } = {},
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    getVercelUrl() ??
    (typeof window !== "undefined" ? window.location.origin : null) ??
    `http://localhost:${port}`;

  const url = new URL(subpath, baseUrl);

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const urlString = url.href;

  return urlString.endsWith("/") ? urlString.slice(0, -1) : urlString;
}

export function shortUrl(subpath = "") {
  const baseUrl = process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? absoluteUrl();
  return joinPath(baseUrl, subpath);
}
