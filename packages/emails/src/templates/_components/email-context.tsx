export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
};

export const defaultEmailContext = {
  logoUrl: "https://rallly-public.s3.amazonaws.com/images/rallly-logo-mark.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
};
