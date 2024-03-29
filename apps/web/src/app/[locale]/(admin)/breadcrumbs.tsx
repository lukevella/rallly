import { Icon } from "@rallly/ui/icon";
import { ChevronRightIcon } from "lucide-react";

import { PageContent } from "@/app/components/page-layout";
import { CurrentUserAvatar } from "@/components/user";

export function Breadcrumbs() {
  return (
    <PageContent className="flex items-center gap-2.5">
      <CurrentUserAvatar size="sm" />
      <Icon>
        <ChevronRightIcon />
      </Icon>
      <div className="text-sm font-medium">Home</div>
    </PageContent>
  );
}
