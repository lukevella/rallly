import { CommandMenu } from "@/features/navigation/command-menu";
import { SidebarProvider } from "@rallly/ui/sidebar";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CommandMenu />
      {children}
    </SidebarProvider>
  );
}
