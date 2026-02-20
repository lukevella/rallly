"use client";

import type { LinkProps } from "next/link";
import Link from "next/link";
import React from "react";

export function HoverPrefetchLink({
  children,
  ...props
}: LinkProps & { children?: React.ReactNode; className?: string }) {
  const [active, setActive] = React.useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(e) => {
        setActive(true);
        props.onMouseEnter?.(e);
      }}
    >
      {children}
    </Link>
  );
}
