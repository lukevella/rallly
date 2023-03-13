import { absoluteUrl } from "@rallly/utils";

export const removeProtocalFromUrl = (url: string) => {
  return url.replace(/(^\w+:|^)\/\//, "");
};

export const getDomain = () => removeProtocalFromUrl(absoluteUrl());
