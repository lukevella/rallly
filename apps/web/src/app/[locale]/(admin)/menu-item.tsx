"use client";

import { cn } from "@rallly/ui";
import { Link } from "lucide-react";
import { usePathname } from "next/navigation";

import { IconComponent } from "@/types";

export function MenuItem({
  href,
  children,
  icon: Icon,
}: {
  href: string;
  icon: IconComponent;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCurrent = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        isCurrent
          ? "bg-gray-200 text-indigo-600"
          : "text-gray-700 hover:text-primary",
        "group flex  items-center gap-x-3 rounded-md py-2 px-3 text-sm leading-6 font-semibold",
      )}
    >
      <Icon
        className={cn(
          isCurrent
            ? "text-indigo-600"
            : "text-gray-400 group-hover:text-indigo-600",
          "h-5 w-5 shrink-0",
        )}
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}
