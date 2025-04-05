"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Trans } from "@/components/trans";
import { IfCloudHosted } from "@/contexts/environment";

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      defaultValue={pathname}
      onValueChange={(value) => {
        router.push(value);
      }}
    >
      <TabsList>
        <TabsTrigger asChild value="/settings/profile">
          <Link href="/settings/profile">
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </TabsTrigger>
        <TabsTrigger asChild value="/settings/preferences">
          <Link href="/settings/preferences">
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </TabsTrigger>
        <IfCloudHosted>
          <TabsTrigger asChild value="/settings/billing">
            <Link href="/settings/billing">
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
