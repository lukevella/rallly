"use client";
import { Button, ButtonProps } from "@rallly/ui/button";
import { signOut } from "next-auth/react";

import { usePostHog } from "@/utils/posthog";

export function LogoutButton({
  children,
  onClick,
  ...rest
}: React.PropsWithChildren<ButtonProps>) {
  const posthog = usePostHog();
  return (
    <Button
      {...rest}
      onClick={async (e) => {
        onClick?.(e);
        posthog?.capture("logout");
        posthog?.reset();
        signOut({
          redirect: true,
          callbackUrl: "/login",
        });
      }}
    >
      {children}
    </Button>
  );
}
