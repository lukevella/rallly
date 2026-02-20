"use client";

import type { LinkProps } from "next/link";
import Link from "next/link";
import { useState } from "react";

export function HoverPrefetchLink({
  children,
  ...props
}: LinkProps & { children?: React.ReactNode; className?: string }) {
  const [active, setActive] = useState(false);

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
