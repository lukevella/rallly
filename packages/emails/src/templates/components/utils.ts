export const removeProtocalFromUrl = (url: string) => {
  return url.replace(/(^\w+:|^)\/\//, "");
};
