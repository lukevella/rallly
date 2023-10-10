import Link, { LinkProps } from "next/link";
import { signIn } from "next-auth/react";
import React from "react";

export const LoginLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<Omit<LinkProps, "href"> & { className?: string }>
>(function LoginLink({ children, ...props }, ref) {
  return (
    <Link
      ref={ref}
      {...props}
      href="/login"
      onClick={async (e) => {
        e.preventDefault();
        signIn();
        props.onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
});
