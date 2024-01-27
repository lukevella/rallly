export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
};

export const defaultEmailContext = {
  logoUrl: "https://rallly.co/logo.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
};
