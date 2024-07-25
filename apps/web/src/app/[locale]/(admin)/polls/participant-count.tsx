import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";

export function ParticipantCount({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-x-1 text-sm font-medium">
      <Icon>
        <UserIcon />
      </Icon>
      <span>{count}</span>
    </div>
  );
}
