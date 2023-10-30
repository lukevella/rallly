import Link, { LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  return (
    <Link
      ref={ref}
      {...props}
      href="/login"
      onClick={async (e) => {
        e.preventDefault();
        props.onClick?.(e);
        router.push("/login?callbackUrl=" + encodeURIComponent(pathname));
      }}
    >
      {children}
    </Link>
  );
});
