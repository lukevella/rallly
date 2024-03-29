"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { InfoIcon } from "lucide-react";

import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";

function WorkspaceSelect() {
  const { user } = useUser();
  return (
    <Select value="default">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Personal Account</SelectLabel>
          <SelectItem value="default">
            <div className="flex items-center gap-x-2.5">
              <CurrentUserAvatar size="xs" />
              {user.name}
            </div>
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          <SelectItem value="mit">
            <div className="flex items-center gap-x-2.5">
              <span className="inline-block size-5 rounded-sm bg-gray-800" />
              MIT
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function Hint({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="flex grow flex-col gap-x-4 gap-y-1 rounded-md border border-gray-600/10 bg-gray-100 px-3 py-2 lg:flex-row lg:items-center">
        <div className="flex items-center gap-x-2 text-xs font-semibold text-gray-600">
          <InfoIcon className="size-4 text-gray-600/75" />
          Guest User
        </div>
        <div className="grow text-sm text-gray-600/90">{children}</div>
      </div>
    </div>
  );
}

function GuestUserAlert() {
  return <Hint>You are using a temporary guest session.</Hint>;
}

export function AdminHeader() {
  return (
    <div>
      <WorkspaceSelect />
    </div>
  );
}
