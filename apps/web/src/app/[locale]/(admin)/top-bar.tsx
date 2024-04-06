import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";

import { UserMenu } from "@/app/[locale]/(admin)/user-menu";

export function TopBar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-x-2.5">
        <UserMenu />
        <Button asChild>
          <Link href="/new">
            <Icon>
              <PlusIcon />
            </Icon>
          </Link>
        </Button>
      </div>
      <div>
        <Button asChild>
          <Link href="/settings/preferences">
            <Icon>
              <Settings2Icon />
            </Icon>
          </Link>
        </Button>
      </div>
    </div>
  );
}
