"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";

import { Trans } from "@/components/trans";

import { cn } from "@rallly/ui";
import React from "react";

export function UsersTabbedView({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const name = "role";
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [tab, setTab] = React.useState(searchParams.get(name) ?? "all");
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
    [router, searchParams],
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">
          <Trans i18nKey="userRoleAll" defaults="All" />
        </TabsTrigger>
        <TabsTrigger value="user">
          <Trans i18nKey="userRoleUser" defaults="Users" />
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Trans i18nKey="userRoleAdmin" defaults="Admins" />
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
