import { TimeFormatControl } from "@/components/layouts/timeformat";
import { TimezoneControl } from "@/components/layouts/timezone-control";
import { UserDropdown } from "@/components/user-dropdown";

export function PollLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-6 lg:px-6 lg:py-5">
      <div className="flex justify-between">
        <UserDropdown />
        <div className="flex gap-x-2.5">
          <TimeFormatControl />
          <TimezoneControl />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
