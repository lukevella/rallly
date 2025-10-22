"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { validateRedirectUrl } from "@/utils/redirect";

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
  const validatedRedirectTo = validateRedirectUrl(
    searchParams.get("redirectTo"),
  );

  return (
    <Link
      className={className}
      href={
        validatedRedirectTo
          ? `${href}?redirectTo=${encodeURIComponent(validatedRedirectTo)}`
          : href
      }
    >
      {children}
    </Link>
  );
}
