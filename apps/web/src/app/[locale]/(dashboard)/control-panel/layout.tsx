import { SidebarInset } from "@rallly/ui/sidebar";
import { ControlPanelSidebar } from "./sidebar";

export default function ControlPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ControlPanelSidebar />
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
