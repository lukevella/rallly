import { LogoLink } from "@/app/components/logo-link";
import { TimeFormatControl } from "@/components/layouts/timeformat";
import { TimezoneControl } from "@/components/layouts/timezone-control";
import { UserDropdown } from "@/components/user-dropdown";

export function PollLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-4 lg:p-4">
      <div className="flex justify-between">
        <div className="flex gap-x-2.5">
          <LogoLink />
        </div>
        <div className="flex gap-x-2.5">
          <TimeFormatControl />
          <TimezoneControl />
          <UserDropdown />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
