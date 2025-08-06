"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Trans } from "@/components/trans";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";

export function SettingsTabs({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const activeTab = segments[0] || "general";

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        <TabsTrigger value="general" asChild>
          <Link href="/settings/general">
            <Trans i18nKey="general" defaults="General" />
          </Link>
        </TabsTrigger>
        <TabsTrigger value="members" asChild>
          <Link href="/settings/members">
            <Trans i18nKey="members" defaults="Members" />
          </Link>
        </TabsTrigger>
        <IfFeatureEnabled feature="billing">
          <TabsTrigger value="billing" asChild>
            <Link href="/settings/billing">
              <Trans i18nKey="billing" defaults="Billing" />
            </Link>
          </TabsTrigger>
        </IfFeatureEnabled>
      </TabsList>
      <TabsContent tabIndex={-1} value={activeTab}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
