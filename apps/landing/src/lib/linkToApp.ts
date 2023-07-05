export const linkToApp = (path?: string) => {
  return process.env.NEXT_PUBLIC_APP_BASE_URL + (path ? path : "");
};
