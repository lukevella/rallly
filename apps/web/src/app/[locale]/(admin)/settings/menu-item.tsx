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
        "flex min-w-0 items-center rounded-none gap-x-2 px-3 py-2 text-sm font-medium",
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
      <div className="hidden overflow-hidden shadow-sm divide-x lg:inline-flex mb-4 border rounded-md bg-gray-50">
        {menuItems.map((item, i) => (
          <MenuItem key={i} href={item.href}>
            <item.icon className="h-4 w-4" />
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
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
