import { LogoLink } from "@/app/components/logo-link";
import { UserDropdown } from "@/components/user-dropdown";

export function PollLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-6 lg:p-6">
      <div className="flex justify-between">
        <LogoLink />
        <UserDropdown />
      </div>
      <div>{children}</div>
    </div>
  );
}
