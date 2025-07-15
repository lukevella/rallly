"use client";

import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  BarChart2Icon,
  CalendarIcon,
  CreditCardIcon,
  EyeIcon,
  HomeIcon,
  PlusIcon,
  Settings2Icon,
  SettingsIcon,
  UserCogIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import type React from "react";

const pageIconVariants = cva("inline-flex items-center justify-center", {
  variants: {
    color: {
      darkGray: "bg-gray-700 text-white",
      indigo: "bg-indigo-500 text-white",
      gray: "bg-gray-200 text-gray-600",
      lime: "bg-lime-500 text-white",
      blue: "bg-blue-500 text-white",
      rose: "bg-rose-500 text-white",
      purple: "bg-purple-500 text-white",
    },
    size: {
      sm: "size-7 rounded-md [&_svg]:size-4",
      md: "size-8 rounded-lg [&_svg]:size-5",
      lg: "size-9 rounded-lg [&_svg]:size-5",
      xl: "size-10 rounded-lg [&_svg]:size-5",
    },
  },
  defaultVariants: {
    color: "gray",
    size: "md",
  },
});

type PageIconVariantProps = VariantProps<typeof pageIconVariants>;

export function PageIcon({
  children,
  color,
  size,
}: {
  children: React.ReactNode;
} & PageIconVariantProps) {
  return (
    <span className={pageIconVariants({ color, size })}>
      <Slot>{children}</Slot>
    </span>
  );
}

export function SettingsPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <SettingsIcon />
    </PageIcon>
  );
}

export function AccountPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <UserCogIcon />
    </PageIcon>
  );
}
export function SpacesPageIcon() {
  return (
    <PageIcon color="lime" size="md">
      <EyeIcon />
    </PageIcon>
  );
}

export function MembersPageIcon() {
  return (
    <PageIcon color="indigo" size="md">
      <UsersIcon />
    </PageIcon>
  );
}

export function TeamsPageIcon() {
  return (
    <PageIcon color="indigo" size="md">
      <UsersIcon />
    </PageIcon>
  );
}
export function HomePageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="darkGray" size="md" {...props}>
      <HomeIcon />
    </PageIcon>
  );
}
export function CreatePageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <PlusIcon />
    </PageIcon>
  );
}

export function PollPageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="purple" size="md" {...props}>
      <BarChart2Icon />
    </PageIcon>
  );
}

export function EventPageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="rose" size="md" {...props}>
      <CalendarIcon />
    </PageIcon>
  );
}

export function ProfilePageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="gray" size="md" {...props}>
      <UserIcon />
    </PageIcon>
  );
}

export function PreferencesPageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="gray" size="md" {...props}>
      <Settings2Icon />
    </PageIcon>
  );
}

export function BillingPageIcon(props: PageIconVariantProps) {
  return (
    <PageIcon color="gray" size="md" {...props}>
      <CreditCardIcon />
    </PageIcon>
  );
}
