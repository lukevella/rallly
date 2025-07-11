"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Trans } from "@/components/trans";
import { IfCloudHosted } from "@/contexts/environment";

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Tabs value={pathname}>
      <TabsList>
        <TabsTrigger asChild value="/account/profile">
          <Link href="/account/profile">
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </TabsTrigger>
        <TabsTrigger asChild value="/account/preferences">
          <Link href="/account/preferences">
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </TabsTrigger>
        <IfCloudHosted>
          <TabsTrigger asChild value="/account/billing">
            <Link href="/account/billing">
              <Trans i18nKey="billing" defaults="Billing" />
            </Link>
          </TabsTrigger>
        </IfCloudHosted>
      </TabsList>
      <TabsContent className="mt-4" value={pathname}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
