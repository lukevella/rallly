import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  const pathname = usePathname() ?? "/";
  return (
    <Link
      ref={ref}
      {...props}
      href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
    >
      {children}
    </Link>
  );
});
