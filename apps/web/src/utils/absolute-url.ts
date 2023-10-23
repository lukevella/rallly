const port = process.env.PORT || 3000;

const getVercelUrl = () => {
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : null;
};

function joinPath(baseUrl: string, subpath = "") {
  if (subpath) {
    const url = new URL(subpath, baseUrl);
    return url.href;
  }

  return baseUrl;
}

export function objectToQueryString(obj: Record<string, string>) {
  const parts = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== undefined) {
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
      }
    }
  }
  return parts.join("&");
}
export function absoluteUrl(subpath = "", query?: Record<string, string>) {
  const queryString = query ? `?${objectToQueryString(query)}` : "";

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    getVercelUrl() ??
    `http://localhost:${port}`;

  return joinPath(baseUrl, subpath) + queryString;
}

export function shortUrl(subpath = "") {
  const baseUrl = process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? absoluteUrl();
  return joinPath(baseUrl, subpath);
}
