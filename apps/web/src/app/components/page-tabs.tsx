"use client";
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
  const [tab, setTab] = React.useState(value);
  const handleTabChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      params.delete("page");
      setTab(value);

      const newUrl = `?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams, name],
  );

  return (
    <Tabs className="group" value={tab} onValueChange={handleTabChange}>
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
    <TabsContent
      tabIndex={-1}
      forceMount={true}
      key={value}
      className="transition-opacity data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-50 data-[state=inactive]:delay-200"
      value={value}
    >
      {children}
    </TabsContent>
  );
}
