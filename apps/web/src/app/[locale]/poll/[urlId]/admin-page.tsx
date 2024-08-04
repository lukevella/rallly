"use client";
import { GroupPollInvite } from "@/components/group-poll-invite/group-poll-invite";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";

import { GuestPollAlert } from "./guest-poll-alert";

export function AdminPage() {
  useTouchBeacon();
  return (
    <div className="flex h-full flex-col">
      <GuestPollAlert />
      <div className="grow">
        <GroupPollInvite />
      </div>
    </div>
  );
}
