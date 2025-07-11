"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LinkWithRedirectTo({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  return (
    <Link
      className={className}
      href={
        redirectTo
          ? `${href}?redirectTo=${encodeURIComponent(redirectTo)}`
          : href
      }
    >
      {children}
    </Link>
  );
}
