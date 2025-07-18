"use client";
import { cn } from "@rallly/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function PageTabs({
  children,
  value,
  name,
}: {
  name: string;
  value?: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [tab, setTab] = React.useState(value);
  const handleTabChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      params.delete("page");

      setTab(value);

      startTransition(() => {
        const newUrl = `?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
      });
    },
    [router, searchParams, name],
  );

  return (
    <Tabs
      className={cn(
        "transition-opacity",
        isPending ? "pointer-events-none opacity-50 delay-200" : "",
      )}
      value={tab}
      onValueChange={handleTabChange}
    >
      {children}
    </Tabs>
  );
}
export const PageTabsList = TabsList;
export const PageTabsTrigger = TabsTrigger;

export function PageTabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent tabIndex={-1} value={value}>
      {children}
    </TabsContent>
  );
}
