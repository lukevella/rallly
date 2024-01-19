"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import clsx from "clsx";
import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import { isSelfHosted } from "@/utils/constants";

export function MenuItem(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      className={clsx(
        "flex min-w-0 items-center gap-x-2 rounded-none px-3 py-2 text-sm font-medium",
        pathname === props.href
          ? "bg-white"
          : "text-gray-500 hover:bg-gray-100 focus:bg-gray-200",
      )}
      href={props.href}
    >
      {props.children}
    </Link>
  );
}

export function SettingsMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const menuItems = React.useMemo(() => {
    const items = [
      {
        title: t("profile"),
        href: "/settings/profile",
        icon: UserIcon,
      },
      {
        title: t("preferences"),
        href: "/settings/preferences",
        icon: Settings2Icon,
      },
    ];
    if (!isSelfHosted) {
      items.push({
        title: t("billing"),
        href: "/settings/billing",
        icon: CreditCardIcon,
      });
    }
    return items;
  }, [t]);

  const router = useRouter();
  const value = React.useMemo(
    () => menuItems.find((item) => item.href === pathname),
    [menuItems, pathname],
  );

  return (
    <>
      <div className="mb-4 hidden divide-x overflow-hidden rounded-md border bg-gray-50 shadow-sm lg:inline-flex">
        {menuItems.map((item, i) => (
          <MenuItem key={i} href={item.href}>
            <item.icon className="size-4" />
            {item.title}
          </MenuItem>
        ))}
      </div>
      <Select
        value={value?.title}
        onValueChange={(value) => {
          const item = menuItems.find((item) => item.title === value);
          if (item) {
            router.push(item.href);
          }
        }}
      >
        <SelectTrigger className="lg:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {menuItems.map((item, i) => (
            <SelectItem key={i} value={item.title}>
              <div className="flex items-center gap-x-2.5">
                <item.icon className="text-muted-foreground size-4" />
                <span className="font-medium">{item.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
