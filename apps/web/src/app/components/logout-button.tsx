"use client";
import { usePostHog } from "@rallly/posthog/client";
import type { ButtonProps } from "@rallly/ui/button";
import { Button } from "@rallly/ui/button";

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
        await fetch("/api/logout", { method: "POST" });
        posthog?.capture("logout");
        posthog?.reset();
        window.location.href = "/login";
      }}
    >
      {children}
    </Button>
  );
}
