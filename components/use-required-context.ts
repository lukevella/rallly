import React from "react";

export const useRequiredContext = <T>(
  context: React.Context<T | null>,
  errorMessage?: string,
) => {
  const contextValue = React.useContext(context);
  if (contextValue === null) {
    throw new Error(
      errorMessage ?? `Missing context provider: ${context.displayName}`,
    );
  }
  return contextValue;
};
