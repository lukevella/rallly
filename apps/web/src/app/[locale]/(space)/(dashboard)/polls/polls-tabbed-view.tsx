"use client";

import { cn } from "@rallly/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Trans } from "@/components/trans";
import { statusSchema } from "./schema";

export function PollsTabbedView({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const name = "status";
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const status = statusSchema.parse(searchParams.get("status"));
  const [tab, setTab] = React.useState(status);
  const handleTabChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      params.delete("page");

      setTab(statusSchema.parse(value));

      startTransition(() => {
        const newUrl = `?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="open">
          <Trans i18nKey="pollStatusOpen" defaults="Open" />
        </TabsTrigger>
        <TabsTrigger value="closed">
          <Trans i18nKey="pollStatusClosed" defaults="Closed" />
        </TabsTrigger>
        <TabsTrigger value="scheduled">
          <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
        </TabsTrigger>
      </TabsList>
      <TabsContent
        tabIndex={-1}
        value={tab}
        key={tab}
        className={cn(isPending ? "pointer-events-none opacity-50" : "")}
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}
