export const linkToApp = (path = "", options?: { ref?: string }) => {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_BASE_URL);
  if (options?.ref) {
    url.searchParams.set("ref", options.ref);
  }
  return url.href;
};
