"use client";

import * as React from "react";

// Create a context to expose the dialog state and methods
interface CommandDialogContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
}

const CommandDialogContext = React.createContext<CommandDialogContextValue | undefined>(undefined);

// Custom hook to access the command dialog context
export function useCommandDialog() {
  const context = React.useContext(CommandDialogContext);
  if (!context) {
    throw new Error("useCommandDialog must be used within a CommandDialogProvider");
  }
  return context;
}

export function CommandDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  // Create a toggle function
  const toggle = React.useCallback(() => {
    setOpen((state) => !state);
  }, []);

  // Context value
  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      toggle,
    }),
    [open, toggle]
  );

  return (
    <CommandDialogContext.Provider value={contextValue}>
      {children}
    </CommandDialogContext.Provider>
  );
}
