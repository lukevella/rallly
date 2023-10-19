import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import React from "react";

export const RegisterLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function RegisterLink({ children, ...props }, ref) {
  const router = useRouter();
  return (
    <Link
      ref={ref}
      {...props}
      href="/register"
      onClick={async (e) => {
        e.preventDefault();
        props.onClick?.(e);
        router.push(
          "/register?callbackUrl=" + encodeURIComponent(router.asPath),
        );
      }}
    >
      {children}
    </Link>
  );
});
