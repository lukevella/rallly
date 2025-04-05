"use client";

import { CommandDialog } from "@rallly/ui/command";
import * as React from "react";

import { CommandMenu } from "@/components/command-menu";

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

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  // Context value
  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      toggle,
    }),
    [open, setOpen, toggle]
  );

  return (
    <CommandDialogContext.Provider value={value}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandMenu />
      </CommandDialog>
    </CommandDialogContext.Provider>
  );
}
