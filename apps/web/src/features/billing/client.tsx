"use client";

import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";
import React from "react";
import { PayWallDialog } from "./components/pay-wall-dialog";

interface BillingContextType {
  showPayWall: () => void;
}

const BillingContext = React.createContext<BillingContextType | null>(null);

interface BillingProviderProps {
  children: React.ReactNode;
}

export function BillingProvider({ children }: BillingProviderProps) {
  const [isPayWallOpen, setIsPayWallOpen] = React.useState(false);

  const showPayWall = React.useCallback(() => {
    setIsPayWallOpen(true);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      showPayWall,
    }),
    [showPayWall],
  );

  return (
    <BillingContext.Provider value={contextValue}>
      {children}
      <PayWallDialog isOpen={isPayWallOpen} onOpenChange={setIsPayWallOpen} />
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = React.useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}

export const PayWallButton = ({ onClick, ...forwardedProps }: ButtonProps) => {
  const { showPayWall } = useBilling();
  return (
    <Button
      onClick={(e) => {
        showPayWall();
        onClick?.(e);
      }}
      {...forwardedProps}
    />
  );
};
