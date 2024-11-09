"use client";

import { cn } from "@rallly/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavLink = ({
  className,
  ...props
}: React.ComponentProps<typeof Link>) => {
  const pathname = usePathname();
  const isActive = pathname === props.href;
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-x-2.5 rounded text-sm font-medium",
        isActive ? "" : "hover:text-primary text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
