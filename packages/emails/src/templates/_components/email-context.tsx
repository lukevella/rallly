export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
  locale: string;
};

export const defaultEmailContext = {
  logoUrl: "https://rallly.co/logo.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
  locale: "en",
};
