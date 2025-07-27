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
      <TabsContent
        tabIndex={-1}
        value={tab}
        key={tab}
        className={cn(
          "transition-opacity",
          isPending ? "pointer-events-none opacity-50 delay-200" : "",
        )}
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}
