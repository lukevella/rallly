"use client";
import { Button } from "@rallly/ui/button";
import { ArrowUpLeftIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { UserDropdown } from "@/components/user-dropdown";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

export const Nav = () => {
  const poll = usePoll();
  const { user } = useUser();

  return (
    <PageHeader variant="ghost">
      <div className="flex justify-between">
        <div>
          <Button
            variant="ghost"
            asChild
            className={poll.userId !== user.id ? "hidden" : ""}
          >
            <Link href={`/poll/${poll.id}`}>
              <ArrowUpLeftIcon className="text-muted-foreground h-4 w-4" />
              <Trans i18nKey="manage" />
            </Link>
          </Button>
        </div>
        <div>
          <UserDropdown />
        </div>
      </div>
    </PageHeader>
  );
};
