import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@rallly/ui/sidebar";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/app/components/page-layout";
import { requireUser } from "@/auth/data";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import { SignOutButton } from "./components/sign-out-button";

export default async function ProfileLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Icon>
                        <ArrowLeftIcon />
                      </Icon>
                      <Trans i18nKey="backToDashboard" defaults="Back" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <div className="flex flex-col gap-2 p-4">
              <OptimizedAvatarImage
                size="md"
                name={user.name}
                className="mr-2"
                src={user.image}
              />
              <div className="font-medium">{user.name}</div>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/profile">
                      <Icon>
                        <UserIcon />
                      </Icon>
                      <Trans i18nKey="profile" defaults="Profile" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/preferences">
                      <Icon>
                        <Settings2Icon />
                      </Icon>
                      <Trans i18nKey="preferences" defaults="Preferences" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/billing">
                      <Icon>
                        <CreditCardIcon />
                      </Icon>
                      <Trans i18nKey="billing" defaults="Billing" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <PageContainer>
          <PageHeader>
            <PageHeaderContent>
              <PageTitle>
                <Trans i18nKey="settings" />
              </PageTitle>
            </PageHeaderContent>
            <PageHeaderActions>
              <SignOutButton />
            </PageHeaderActions>
          </PageHeader>
          <PageContent>{children}</PageContent>
        </PageContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
