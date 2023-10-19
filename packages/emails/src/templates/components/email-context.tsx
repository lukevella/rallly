import React from "react";

export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
};

export const EmailContext = React.createContext<EmailContext>({
  logoUrl: "",
  baseUrl: "",
});

export const useEmailContext = () => {
  return React.useContext(EmailContext);
};
