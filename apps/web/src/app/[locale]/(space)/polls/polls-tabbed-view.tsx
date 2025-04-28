"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";

export function PollsTabbedView({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const name = "status";
  const router = useRouter();
  const handleTabChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      params.delete("page");

      const newUrl = `?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams],
  );

  const value = searchParams.get(name) ?? "live";

  return (
    <Tabs value={value} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="live">
          <Trans i18nKey="pollStatusOpen" defaults="Live" />
        </TabsTrigger>
        <TabsTrigger value="paused">
          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </TabsTrigger>
        <TabsTrigger value="finalized">
          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </TabsTrigger>
      </TabsList>
      <TabsContent tabIndex={-1} value={value} key={value}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
