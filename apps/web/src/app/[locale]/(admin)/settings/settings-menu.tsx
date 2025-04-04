"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
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
        <TabsTrigger value="/settings/profile">
          <Trans i18nKey="profile" defaults="Profile" />
        </TabsTrigger>
        <TabsTrigger value="/settings/preferences">
          <Trans i18nKey="preferences" defaults="Preferences" />
        </TabsTrigger>
        <IfCloudHosted>
          <TabsTrigger value="/settings/billing">
            <Trans i18nKey="billing" defaults="Billing" />
          </TabsTrigger>
        </IfCloudHosted>
      </TabsList>
      <TabsContent className="mt-4" value={pathname}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
