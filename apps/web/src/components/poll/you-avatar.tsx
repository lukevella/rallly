import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";

export function YouAvatar() {
  return (
    <div className="inline-flex size-5 items-center justify-center rounded-full bg-gray-200 font-medium text-xs">
      <Icon>
        <UserIcon />
      </Icon>
    </div>
  );
}
