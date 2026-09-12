import { usePathname } from "next/navigation";
import React from "react";
import type { LinkProps } from "@/components/link";
import { Link } from "@/components/link";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  const pathname = usePathname() ?? "/";
  return (
    <Link
      ref={ref}
      {...props}
      href={`/login?redirectTo=${encodeURIComponent(pathname)}`}
    >
      {children}
    </Link>
  );
});
