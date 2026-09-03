export const linkToApp = (
  path = "",
  options?: { ref?: string; cta?: string },
) => {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_BASE_URL);
  if (options?.ref) {
    url.searchParams.set("ref", options.ref);
  }
  // ref says which page the click came from, cta says which button on it.
  if (options?.cta) {
    url.searchParams.set("cta", options.cta);
  }
  return url.href;
};
