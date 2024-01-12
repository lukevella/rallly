import { Button } from "@rallly/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import {
  PageContainer,
  PageContent,
  PageHeader,
} from "@/app/components/page-layout";
import { CreatePoll } from "@/components/create-poll";

export default async function Page() {
  return (
    <PageContainer>
      <PageHeader className="flex items-center">
        <Button asChild>
          <Link href="/">
            <ArrowLeftIcon className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
      </PageHeader>
      <PageContent>
        <CreatePoll />
      </PageContent>
    </PageContainer>
  );
}
