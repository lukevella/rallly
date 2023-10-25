import React from "react";

export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
};

export const EmailContext = React.createContext<EmailContext>({
  logoUrl: "/static/logo.png",
  baseUrl: "",
});

export const useEmailContext = () => {
  const context = React.useContext(EmailContext);
  return {
    ...context,
    domain: context.baseUrl.replace(/(^\w+:|^)\/\//, ""),
  };
};
