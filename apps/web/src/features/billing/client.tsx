"use client";

import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";
import React from "react";
import type { SpaceTier } from "@/features/space/schema";
import { trpc } from "@/trpc/client";
import { PayWallDialog } from "./components/pay-wall-dialog";

interface BillingContextType {
  tier: SpaceTier;
  isFree: boolean;
  showPayWall: () => void;
}

const BillingContext = React.createContext<BillingContextType | null>(null);

function useCurrentTier(): SpaceTier {
  const { data: tier } = trpc.billing.getTier.useQuery();

  return tier ?? "hobby";
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [isPayWallOpen, setIsPayWallOpen] = React.useState(false);
  const tier = useCurrentTier();

  const showPayWall = React.useCallback(() => {
    setIsPayWallOpen(true);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      tier,
      isFree: tier === "hobby",
      showPayWall,
    }),
    [tier, showPayWall],
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
