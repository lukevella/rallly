import { XCircle } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Link from "next/link";

import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";
import { Trans } from "@/components/trans";

const Page = () => {
  return (
    <PageDialog icon={XCircle}>
      <PageDialogHeader>
        <PageDialogTitle>
          <Trans i18nKey="authErrorTitle" defaults="Login Error" />
        </PageDialogTitle>
        <PageDialogDescription>
          <Trans
            i18nKey="authErrorDescription"
            defaults="There was an error logging you in. Please try again."
          />
        </PageDialogDescription>
      </PageDialogHeader>
      <PageDialogFooter>
        <Button asChild variant="primary">
          <Link href="/login">
            <Trans i18nKey="authErrorCta" defaults="Go to login page" />
          </Link>
        </Button>
      </PageDialogFooter>
    </PageDialog>
  );
};

export default Page;
