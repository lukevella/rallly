"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";

export function EventsTabbedView({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const name = "period";
  const router = useRouter();
  const handleTabChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      params.delete("page");

      const newUrl = `?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [name, router, searchParams],
  );

  const value = searchParams.get(name) ?? "upcoming";

  return (
    <Tabs value={value} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="upcoming">
          <Trans i18nKey="upcoming" defaults="Upcoming" />
        </TabsTrigger>
        <TabsTrigger value="past">
          <Trans i18nKey="past" defaults="Past" />
        </TabsTrigger>
      </TabsList>
      <TabsContent tabIndex={-1} value={value} key={value}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
