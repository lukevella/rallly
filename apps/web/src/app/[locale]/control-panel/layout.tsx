import { requireAdmin } from "@/auth/queries";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { getTranslation } from "@/i18n/server";
import { SidebarInset } from "@rallly/ui/sidebar";
import { ControlPanelSidebarProvider } from "./control-panel-sidebar-provider";
import { ControlPanelSidebar } from "./sidebar";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <ControlPanelSidebarProvider>
      <CommandMenu />
      <ControlPanelSidebar />
      <SidebarInset>
        <LicenseLimitWarning />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </SidebarInset>
    </ControlPanelSidebarProvider>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: {
      template: `%s | ${t("controlPanel", {
        defaultValue: "Control Panel",
      })}`,
      default: t("controlPanel", {
        defaultValue: "Control Panel",
      }),
    },
  };
}
