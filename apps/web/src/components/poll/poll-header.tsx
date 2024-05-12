import { LogoLink } from "@/app/components/logo-link";
import { UserDropdown } from "@/components/user-dropdown";

export function PollHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-2.5">
        <LogoLink />
      </div>
      <div className="flex items-center gap-x-2.5">
        <UserDropdown />
      </div>
    </div>
  );
}
