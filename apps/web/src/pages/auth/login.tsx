import { InfoIcon } from "@rallly/icons";
import Link from "next/link";

import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";

const Page = () => {
  return (
    <PageDialog icon={InfoIcon}>
      <PageDialogHeader>
        <PageDialogTitle>Please login again</PageDialogTitle>
        <PageDialogDescription>
          This login was initiated with an older version of Rallly. Please login
          again to continue. Sorry for the inconvinience.
        </PageDialogDescription>
      </PageDialogHeader>
      <PageDialogFooter>
        <Link href="/login" className="text-link">
          Login
        </Link>
      </PageDialogFooter>
    </PageDialog>
  );
};

export default Page;
