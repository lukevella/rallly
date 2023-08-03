import {
  BugIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  MegaphoneIcon,
  SmileIcon,
} from "@rallly/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import Link from "next/link";
import { Trans } from "next-i18next";

const FeedbackButton = () => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="shadow-huge fixed bottom-8 right-6 hidden h-12 w-12 items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 active:shadow-none sm:inline-flex">
        <MegaphoneIcon className="h-5 text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={10} align="end">
        <DropdownMenuLabel>
          <Trans i18nKey="menu" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`https://feedback.rallly.co/?b=feedback`}
            target={"_blank"}
          >
            <SmileIcon className="mr-2 h-4 w-4" />
            <Trans i18nKey="sendFeedback" defaults="Send Feedback" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`https://feedback.rallly.co/?b=feature-request`}
            target={"_blank"}
          >
            <LightbulbIcon className="mr-2 h-4 w-4" />
            <Trans i18nKey={"featureRequest"} defaults={"Request a Feature"} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`https://feedback.rallly.co/?b=bug-reports`}
            target={"_blank"}
          >
            <BugIcon className="mr-2 h-4 w-4" />
            <Trans i18nKey={"bugReport"} defaults={"Report an Issue"} />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`https://support.rallly.co`} target={"_blank"}>
            <LifeBuoyIcon className="mr-2 h-4 w-4" />
            <Trans i18nKey={"getSupport"} defaults={"Get Support"} />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FeedbackButton;
