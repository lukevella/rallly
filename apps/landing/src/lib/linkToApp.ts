export const linkToApp = (path = "") => {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_BASE_URL);
  return url.href;
};
