"use client";

import { Slot } from "@radix-ui/react-slot";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href} className="group">
          <Slot className="size-4">{icon}</Slot>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
