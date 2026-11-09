"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { linkToApp } from "@/lib/linkToApp";
import { useRefSlug } from "@/lib/use-ref-slug";

export const LoginButton = ({
  cta = "header_login",
  children,
}: {
  cta?: string;
  children: React.ReactNode;
}) => {
  const ref = useRefSlug();
  return (
    <Link
      href={linkToApp("/login", { ref, cta })}
      className={buttonVariants({ variant: "ghost" })}
      onClick={() => {
        posthog.capture("landing:login_click", { cta, ref });
      }}
    >
      {children}
    </Link>
  );
};
