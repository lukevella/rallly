"use client";
import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";

import { signOut } from "next-auth/react";

export function LogoutButton({
  children,
  onClick,
  ...rest
}: React.PropsWithChildren<ButtonProps>) {
  return (
    <Button
      {...rest}
      onClick={async (e) => {
        await signOut();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
}
