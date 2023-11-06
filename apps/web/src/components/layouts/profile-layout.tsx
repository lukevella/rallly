import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import clsx from "clsx";
import {
  CreditCardIcon,
  MenuIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Trans } from "react-i18next";
import { useToggle } from "react-use";

import { Container } from "@/components/container";
import { IfCloudHosted } from "@/contexts/environment";
import { Plan } from "@/contexts/plan";

import { IconComponent } from "../../types";
import { IfAuthenticated, useUser } from "../user-provider";

const MenuItem = (props: {
  icon: IconComponent;
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  return (
    <Link
      className={clsx(
        "flex min-w-0 items-center gap-x-2.5 px-2.5 py-1.5 text-sm font-medium",
        pathname === props.href
          ? "bg-gray-200"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
      )}
      href={props.href}
    >
      <props.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{props.children}</span>
    </Link>
  );
};

export const ProfileLayout = ({ children }: React.PropsWithChildren) => {
  const { user } = useUser();

  // reset toggle whenever route changes
  const pathname = usePathname();

  const [isMenuOpen, toggle] = useToggle(false);

  React.useEffect(() => {
    toggle(false);
  }, [pathname, toggle]);

  return (
    <div>
      <Container className="p-2 sm:py-8">
        <Card className="mx-auto flex flex-col overflow-hidden md:min-h-[600px]">
          <div className="border-b bg-gray-50 p-3 md:hidden">
            <Button onClick={toggle} icon={MenuIcon} />
          </div>
          <div className="relative flex grow md:divide-x">
            <div
              className={cn(
                "absolute inset-0 z-10 grow bg-gray-50 md:static md:block md:shrink-0 md:grow-0 md:basis-56 md:px-5 md:py-4",
                {
                  hidden: !isMenuOpen,
                },
              )}
            >
              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-x-2.5 gap-y-2 p-3">
                  <div className="truncate text-sm font-semibold">
                    {user.name}
                  </div>
                  <Plan />
                </div>
                <IfAuthenticated>
                  <MenuItem href="/settings/profile" icon={UserIcon}>
                    <Trans i18nKey="profile" defaults="Profile" />
                  </MenuItem>
                </IfAuthenticated>
                <MenuItem href="/settings/preferences" icon={Settings2Icon}>
                  <Trans i18nKey="preferences" defaults="Preferences" />
                </MenuItem>
                <IfCloudHosted>
                  <MenuItem href="/settings/billing" icon={CreditCardIcon}>
                    <Trans i18nKey="billing" defaults="Billing" />
                  </MenuItem>
                </IfCloudHosted>
              </div>
            </div>
            <div className="max-w-2xl grow">{children}</div>
          </div>
        </Card>
      </Container>
    </div>
  );
};
