import { Icon } from "@rallly/ui/icon";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { GaugeIcon } from "lucide-react";
import type { Metadata } from "next";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { createAdminSSRHelper } from "@/trpc/next/ssr";
import { ControlPanelSidebarProvider } from "./control-panel-sidebar-provider";
import { ControlPanelSidebar } from "./sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { helpers } = await createAdminSSRHelper();
  await helpers.user.getAuthed.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <ControlPanelSidebarProvider>
        <CommandMenu />
        <ControlPanelSidebar />
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
    </HydrationBoundary>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
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
