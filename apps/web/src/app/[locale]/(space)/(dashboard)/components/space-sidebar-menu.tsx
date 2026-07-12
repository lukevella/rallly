"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { useSpaceMenu } from "@/features/navigation/client";

export function SpaceSidebarMenu() {
  const { config } = useSpaceMenu();
  return (
    <>
      {config.sections.map((section) => {
        return (
          <SidebarGroup key={section.id}>
            {section.title && (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        render={<HoverPrefetchLink href={item.href} />}
                        isActive={item.isActive}
                      >
                        <item.icon />
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
