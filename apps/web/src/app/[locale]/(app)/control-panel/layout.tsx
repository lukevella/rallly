import { Icon } from "@rallly/ui/icon";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import { GaugeIcon } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/auth/data";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { ControlPanelSidebarProvider } from "./control-panel-sidebar-provider";
import { ControlPanelSidebar } from "./sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <ControlPanelSidebarProvider>
      <CommandMenu />
      <ControlPanelSidebar
        user={{
          name: user.name,
          image: user.image,
          email: user.email,
        }}
      />
      <SidebarInset>
        <LicenseLimitWarning />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/90 p-3 backdrop-blur-xs md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Icon>
                  <GaugeIcon />
                </Icon>
                <span className="font-medium text-sm">
                  <Trans i18nKey="controlPanel" defaults="Control Panel" />
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:py-12">{children}</main>
        </div>
      </SidebarInset>
    </ControlPanelSidebarProvider>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  "use cache";
  const { locale } = await params;
  const { t } = await getTranslation(locale);
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
