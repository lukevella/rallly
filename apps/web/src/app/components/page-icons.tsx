"use client";

import {
  BarChart2Icon,
  CalendarIcon,
  CreditCardIcon,
  HomeIcon,
  PlusIcon,
  Settings2Icon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";

export function SettingsPageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
      <SettingsIcon className="size-4" />
    </span>
  );
}

export function MembersPageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white">
      <UsersIcon className="size-4" />
    </span>
  );
}
export function HomePageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gray-800 text-white">
      <HomeIcon className="size-4" />
    </span>
  );
}
export function CreatePageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gray-800 text-white">
      <PlusIcon className="size-4" />
    </span>
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
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white">
      <CalendarIcon className="size-4" />
    </span>
  );
}

export function ProfilePageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white">
      <UserIcon className="size-4" />
    </span>
  );
}

export function PreferencesPageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white">
      <Settings2Icon className="size-4" />
    </span>
  );
}

export function BillingPageIcon() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-500 text-white">
      <CreditCardIcon className="size-4" />
    </span>
  );
}
