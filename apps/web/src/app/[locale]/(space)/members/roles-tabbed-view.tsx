"use client";
import { cn } from "@rallly/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";

export function RolesTabbedView({
  children,
  value = "all",
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
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">
          <Trans i18nKey="spaceMembersAll" defaults="All" />
        </TabsTrigger>
        <TabsTrigger value="member">
          <Trans i18nKey="spaceMembersMembers" defaults="Members" />
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Trans i18nKey="spaceMembersAdmin" defaults="Admins" />
        </TabsTrigger>
        <TabsTrigger value="owner">
          <Trans i18nKey="spaceMembersOwners" defaults="Owners" />
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
