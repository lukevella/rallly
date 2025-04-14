"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
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
import React from "react";

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
      sm: "size-6 [&_svg]:size-3 rounded-md",
      md: "size-7 [&_svg]:size-4 rounded-lg",
      lg: "size-9 [&_svg]:size-5 rounded-xl",
      xl: "size-10 [&_svg]:size-5 rounded-xl",
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
export function HomePageIcon() {
  return (
    <PageIcon color="darkGray" size="md">
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

export function EventPageIcon() {
  return (
    <PageIcon color="rose" size="md">
      <CalendarIcon />
    </PageIcon>
  );
}

export function ProfilePageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <UserIcon />
    </PageIcon>
  );
}

export function PreferencesPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <Settings2Icon />
    </PageIcon>
  );
}

export function BillingPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <CreditCardIcon />
    </PageIcon>
  );
}
