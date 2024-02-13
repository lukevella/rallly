import { Button } from "@rallly/ui/button";
import { ChevronRightIcon, XIcon } from "lucide-react";
import Link from "next/link";

import { CreateForm } from "@/app/[locale]/(admin)/create/create-form";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";

export default async function Page({ params }: { params: { locale: string } }) {
  return (
    <PageContainer className="flex flex-col bg-gray-50">
      <PageContent className="grow">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-x-4 text-sm">
            <div>Details</div>
            <ChevronRightIcon className="text-muted-foreground size-4" />
            <div>Poll</div>
            <ChevronRightIcon className="text-muted-foreground size-4" />
            <div>Review</div>
          </div>
          <div>
            <Button asChild variant="ghost">
              <Link href="/polls">
                <XIcon className="text-muted-foreground size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto">
          <h1 className="mb-2 text-3xl font-bold">Scheduling Poll</h1>
          <p className="text-muted-foreground">
            Vote on the best time to meet or schedule an event.
          </p>
          <div className="mt-8">
            <CreateForm />
          </div>
        </div>
      </PageContent>
      <div className="flex justify-end border-t px-8 py-6">
        <Button variant="primary">Next: Poll</Button>
      </div>
    </PageContainer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
