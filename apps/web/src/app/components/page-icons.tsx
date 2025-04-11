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

const pageIconVariants = cva(
  "inline-flex size-7 items-center justify-center rounded-lg",
  {
    variants: {
      color: {
        darkGray: "bg-gray-700 text-white",
        indigo: "bg-indigo-500 text-white",
        gray: "bg-gray-200 text-gray-600",
        lime: "bg-lime-500 text-white",
        blue: "bg-blue-500 text-white",
        rose: "bg-rose-500 text-white",
      },
      size: {
        sm: "size-5",
        md: "size-7",
      },
    },
    defaultVariants: {
      color: "indigo",
      size: "md",
    },
  },
);

type PageIconVariantProps = VariantProps<typeof pageIconVariants>;

function PageIcon({
  children,
  color,
  size,
}: {
  children: React.ReactNode;
} & PageIconVariantProps) {
  return (
    <span className={pageIconVariants({ color, size })}>
      <Slot className="size-4">{children}</Slot>
    </span>
  );
}

export function SettingsPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <SettingsIcon className="size-4" />
    </PageIcon>
  );
}

export function AccountPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <UserCogIcon className="size-4" />
    </PageIcon>
  );
}
export function SpacesPageIcon() {
  return (
    <PageIcon color="lime" size="md">
      <EyeIcon className="size-4" />
    </PageIcon>
  );
}

export function MembersPageIcon() {
  return (
    <PageIcon color="indigo" size="md">
      <UsersIcon className="size-4" />
    </PageIcon>
  );
}

export function TeamsPageIcon() {
  return (
    <PageIcon color="indigo" size="md">
      <UsersIcon className="size-4" />
    </PageIcon>
  );
}
export function HomePageIcon() {
  return (
    <PageIcon color="darkGray" size="md">
      <HomeIcon className="size-4" />
    </PageIcon>
  );
}
export function CreatePageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <PlusIcon className="size-4" />
    </PageIcon>
  );
}

export function PollPageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-purple-500 text-white">
      <BarChart2Icon className="size-4" />
    </span>
  );
}

export function EventPageIcon() {
  return (
    <PageIcon color="rose" size="md">
      <CalendarIcon className="size-4" />
    </PageIcon>
  );
}

export function ProfilePageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <UserIcon className="size-4" />
    </PageIcon>
  );
}

export function PreferencesPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <Settings2Icon className="size-4" />
    </PageIcon>
  );
}

export function BillingPageIcon() {
  return (
    <PageIcon color="gray" size="md">
      <CreditCardIcon className="size-4" />
    </PageIcon>
  );
}
