"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTimeoutFn } from "react-use";

import { PageDialog, PageDialogDescription } from "@/components/page-dialog";
import { Trans } from "@/components/trans";

export function Redirect({ href }: { from: string; href: string }) {
  const router = useRouter();
  useTimeoutFn(() => {
    router.push(href);
  }, 3000);

  return (
    <PageDialog>
      <PageDialogDescription>
        <Trans
          i18nKey="pageMovedDescription"
          defaults="Redirecting to <a>{newUrl}</a>"
          values={{
            newUrl: href,
          }}
          components={{
            a: <Link className="text-link" href={href} />,
          }}
        />
      </PageDialogDescription>
    </PageDialog>
  );
}
