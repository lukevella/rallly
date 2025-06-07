"use client";

import { SidebarProvider } from "@rallly/ui/sidebar";
import { useLocalStorage } from "react-use";

export function ControlPanelSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [value, setValue] = useLocalStorage(
    "control-panel-sidebar_state",
    "expanded",
  );
  return (
    <SidebarProvider
      open={value === "expanded"}
      onOpenChange={(open) => {
        setValue(open ? "expanded" : "collapsed");
      }}
    >
      {children}
    </SidebarProvider>
  );
}
