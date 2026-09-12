import { usePathname, useRouter } from "next/navigation";
import React from "react";
import type { LinkProps } from "@/components/link";
import { Link } from "@/components/link";

export const RegisterLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function RegisterLink({ children, ...props }, ref) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  return (
    <Link
      ref={ref}
      {...props}
      href="/register"
      onClick={async (e) => {
        e.preventDefault();
        props.onClick?.(e);
        router.push(`/register?redirectTo=${encodeURIComponent(pathname)}`);
      }}
    >
      {children}
    </Link>
  );
});
