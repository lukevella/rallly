import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PlusIcon,
  RotateCwIcon,
  ShareIcon,
  TextIcon,
} from "lucide-react";

const ToolbarPill = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-8 items-center gap-3 rounded-full border border-gray-200 px-3 text-gray-500">
    {children}
  </div>
);

// A decorative browser toolbar so the desktop shot reads as the invite page a
// participant opens from their link.
export const BrowserChrome = ({ url }: { url: string }) => (
  <div className="grid grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-gray-200/80 border-b bg-white px-4 py-2.5">
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <ToolbarPill>
        <ChevronLeftIcon className="size-4" />
        <span className="h-4 w-px bg-gray-200" />
        <ChevronRightIcon className="size-4 text-gray-300" />
      </ToolbarPill>
    </div>
    <div className="flex h-8 items-center gap-3 rounded-full border border-gray-200 px-3 text-gray-500">
      <TextIcon className="size-4" />
      <span className="min-w-0 flex-1 truncate text-center text-gray-700 text-sm">
        {url}
      </span>
      <RotateCwIcon className="size-3.5" />
    </div>
    <div className="flex justify-end">
      <ToolbarPill>
        <ShareIcon className="size-4" />
        <PlusIcon className="size-4" />
        <CopyIcon className="size-4" />
      </ToolbarPill>
    </div>
  </div>
);
