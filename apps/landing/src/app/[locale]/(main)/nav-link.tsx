"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { usePathname } from "next/navigation";
import { LinkBase } from "@/i18n/client/link";

export const NavLink = ({
  className,
  ...props
}: React.ComponentProps<typeof LinkBase>) => {
  const pathname = usePathname();
  const isActive = pathname === props.href;
  return (
    <Button
      className={cn(isActive ? "bg-gray-200 text-foreground" : "", className)}
      asChild
      variant="ghost"
    >
      <LinkBase {...props} />
    </Button>
  );
};
