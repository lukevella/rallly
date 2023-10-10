import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import React from "react";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  const router = useRouter();
  return (
    <Link
      ref={ref}
      {...props}
      href="/login"
      onClick={async (e) => {
        e.preventDefault();
        props.onClick?.(e);
        router.push("/login?callbackUrl=" + encodeURIComponent(router.asPath));
      }}
    >
      {children}
    </Link>
  );
});
