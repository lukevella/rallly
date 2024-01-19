import { cn } from "@rallly/ui";

import { Poll } from "@/components/poll";

import { GuestPollAlert } from "./guest-poll-alert";

export default async function Page() {
  return (
    <div className={cn("mx-auto max-w-4xl space-y-4")}>
      <div className="-mx-1 space-y-3 sm:space-y-6">
        <GuestPollAlert />
        <Poll />
      </div>
    </div>
  );
}
