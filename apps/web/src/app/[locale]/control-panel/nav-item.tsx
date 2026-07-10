"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={href} />} isActive={isActive}>
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
