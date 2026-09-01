"use client";

import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";
import { useRefSlug } from "@/lib/use-ref-slug";

export const LoginButton = () => {
  const ref = useRefSlug();
  return (
    <Link
      href={linkToApp("/login", { ref })}
      className={buttonVariants({ variant: "ghost" })}
    >
      <Trans i18nKey="login" defaults="Login" />
    </Link>
  );
};
