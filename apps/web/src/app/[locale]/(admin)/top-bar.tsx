import { IfFreeUser } from "@/contexts/plan";
import { Button } from "@rallly/ui/button";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import Link from "next/link";
import { PlusIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { Icon } from "@rallly/ui/icon";
import { ProBadge } from "./pro-badge";
import { Clock } from "@/components/clock";
import { PayWallDialog } from "@/components/pay-wall-dialog";
import { DialogTrigger } from "@rallly/ui/dialog";

export default function TopBar() {
  return (
    <div className="bg-background/90 sticky top-0 z-10 flex items-center gap-4 rounded-t-lg border-b p-3 backdrop-blur-md">
      <div className="flex-1">
        <div className="flex items-center gap-x-2">
          <SidebarTrigger />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-x-4">
        <div className="flex items-center gap-x-2">
          <Button asChild size="icon" variant="ghost">
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/preferences">
              <Icon>
                <SettingsIcon />
              </Icon>
            </Link>
          </Button>
          <Button size="sm" variant="ghost">
            <Clock />
          </Button>
          <ProBadge />
          <IfFreeUser>
            <PayWallDialog>
              <DialogTrigger>
                <Button size="sm" variant="primary">
                  <Icon>
                    <SparklesIcon />
                  </Icon>
                  Upgrade
                </Button>
              </DialogTrigger>
            </PayWallDialog>
          </IfFreeUser>
        </div>
      </div>
    </div>
  );
}
