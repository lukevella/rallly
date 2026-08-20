"use client";

import { cn } from "@rallly/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Trans } from "@/i18n/client";

const ANY_ACTIVITY = "any";

export function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const setParam = React.useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      params.delete("page");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const inactiveFor = searchParams.get("inactiveFor") ?? ANY_ACTIVITY;
  const sort = searchParams.get("sort") ?? "newest";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 transition-opacity", {
        "pointer-events-none opacity-50 delay-200": isPending,
      })}
    >
      <Select
        items={{
          [ANY_ACTIVITY]: (
            <Trans i18nKey="userActivityAny" defaults="Any activity" />
          ),
          "30d": (
            <Trans i18nKey="userInactiveFor30d" defaults="Inactive 30+ days" />
          ),
          "90d": (
            <Trans i18nKey="userInactiveFor90d" defaults="Inactive 90+ days" />
          ),
          "180d": (
            <Trans
              i18nKey="userInactiveFor180d"
              defaults="Inactive 180+ days"
            />
          ),
          "365d": (
            <Trans i18nKey="userInactiveFor365d" defaults="Inactive 1+ year" />
          ),
        }}
        value={inactiveFor}
        onValueChange={(value) => {
          if (value) {
            setParam(
              "inactiveFor",
              value === ANY_ACTIVITY ? null : String(value),
            );
          }
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_ACTIVITY}>
            <Trans i18nKey="userActivityAny" defaults="Any activity" />
          </SelectItem>
          <SelectItem value="30d">
            <Trans i18nKey="userInactiveFor30d" defaults="Inactive 30+ days" />
          </SelectItem>
          <SelectItem value="90d">
            <Trans i18nKey="userInactiveFor90d" defaults="Inactive 90+ days" />
          </SelectItem>
          <SelectItem value="180d">
            <Trans
              i18nKey="userInactiveFor180d"
              defaults="Inactive 180+ days"
            />
          </SelectItem>
          <SelectItem value="365d">
            <Trans i18nKey="userInactiveFor365d" defaults="Inactive 1+ year" />
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        items={{
          newest: <Trans i18nKey="userSortNewest" defaults="Newest first" />,
          leastRecentlyActive: (
            <Trans
              i18nKey="userSortLeastRecentlyActive"
              defaults="Least recently active"
            />
          ),
        }}
        value={sort}
        onValueChange={(value) => {
          if (value) {
            setParam("sort", value === "newest" ? null : String(value));
          }
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">
            <Trans i18nKey="userSortNewest" defaults="Newest first" />
          </SelectItem>
          <SelectItem value="leastRecentlyActive">
            <Trans
              i18nKey="userSortLeastRecentlyActive"
              defaults="Least recently active"
            />
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
