import React from "react";

export const UserNameContext =
  React.createContext<[string, (userName: string) => void] | null>(null);

export const useUserName = () => {
  const contextValue = React.useContext(UserNameContext);
  if (contextValue === null) {
    throw new Error("Missing UserNameContext.Provider");
  }
  return contextValue;
};
