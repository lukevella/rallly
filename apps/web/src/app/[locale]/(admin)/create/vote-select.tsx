import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import {
  CheckCircle2Icon,
  ChevronDown,
  CircleIcon,
  XCircleIcon,
} from "lucide-react";

export function VoteSelect() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-7 items-center gap-x-2 rounded-md px-2.5">
        <CircleIcon className="text-muted-foreground size-4" />
        <ChevronDown className="text-muted-foreground size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-x-2">
          <CheckCircle2Icon className="text-muted-foreground size-4" />
          <span>Yes</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2">
          <XCircleIcon className="text-muted-foreground size-4" />
          <span>No</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
