"use client";

import { DialogTrigger } from "@rallly/ui/dialog";

import { PayWallDialog } from "@/components/pay-wall-dialog";

export function UpgradeButton({ children }: React.PropsWithChildren) {
  return (
    <PayWallDialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
    </PayWallDialog>
  );
}
