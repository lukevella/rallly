import { Settings2Icon, UserIcon } from "@rallly/icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Trans } from "react-i18next";

import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { StandardLayout } from "@/components/layouts/standard-layout";

import { IconComponent, NextPageWithLayout } from "../../types";
import { IfAuthenticated } from "../user-provider";

const MenuItem = (props: {
  icon: IconComponent;
  href: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  return (
    <Link
      className={clsx(
        "flex items-center gap-x-2.5 text-sm font-medium",
        router.asPath === props.href
          ? "text-foreground"
          : "text-gray-500 hover:text-gray-800",
      )}
      href={props.href}
    >
      <props.icon className="h-5 w-5" />
      {props.children}
    </Link>
  );
};

export const ProfileLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div>
      <Container className="px-0 sm:py-8">
        <Card className="mx-auto max-w-4xl" fullWidthOnMobile={true}>
          <div className="flex gap-4 gap-x-6 border-b bg-gray-50 px-3 py-4 md:px-4">
            <IfAuthenticated>
              <MenuItem href="/settings/profile" icon={UserIcon}>
                <Trans i18nKey="profile" defaults="Profile" />
              </MenuItem>
            </IfAuthenticated>
            <MenuItem href="/settings/preferences" icon={Settings2Icon}>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </MenuItem>
            {/* <IfAuthenticated>
              <MenuItem href="/settings/billing" icon={CreditCardIcon}>
                <Trans i18nKey="billing" defaults="Billing" />
              </MenuItem>
            </IfAuthenticated> */}
          </div>
          {children}
        </Card>
      </Container>
    </div>
  );
};

export const getProfileLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <ProfileLayout>{page}</ProfileLayout>
      </StandardLayout>
    );
  };
