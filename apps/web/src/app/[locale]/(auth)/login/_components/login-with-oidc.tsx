"use client";
import { Button } from "@rallly/ui/button";
import { signIn } from "next-auth/react";

export function LoginWithOIDC({ children }: { children: React.ReactNode }) {
  return (
    <Button
      onClick={() => {
        signIn("oidc");
      }}
      variant="link"
    >
      {children}
    </Button>
  );
}
