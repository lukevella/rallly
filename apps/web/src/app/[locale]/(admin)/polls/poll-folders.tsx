"use client";

import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { FolderIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";

type StatusCounts = {
  live: number;
  paused: number;
  finalized: number;
};

type FolderItem = {
  id: string;
  label: string;
  status?: PollStatus;
  count: number;
};

export function PollFolders({ statusCounts }: { statusCounts: StatusCounts }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "live";

  // Define folders
  const folders: FolderItem[] = [
    {
      id: "live",
      label: "Live",
      status: "live",
      count: statusCounts.live,
    },
    {
      id: "paused",
      label: "Paused",
      status: "paused",
      count: statusCounts.paused,
    },
    {
      id: "finalized",
      label: "Finalized",
      status: "finalized",
      count: statusCounts.finalized,
    },
  ];

  // Handle folder click
  const handleFolderClick = (folderId: string) => {
    const params = new URLSearchParams(searchParams);

    if (folderId === "live") {
      params.delete("status");
    } else {
      params.set("status", folderId);
    }

    // Reset to page 1 when changing filters
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {folders.map((folder) => {
          // Determine which i18nKey to use based on folder id
          let i18nKey:
            | "polls"
            | "pollStatusOpen"
            | "pollStatusPaused"
            | "pollStatusFinalized" = "polls";
          if (folder.id === "live") i18nKey = "pollStatusOpen";
          if (folder.id === "paused") i18nKey = "pollStatusPaused";
          if (folder.id === "finalized") i18nKey = "pollStatusFinalized";

          return (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder.id)}
              className={cn(
                "flex items-center gap-x-2 rounded-md border px-3 py-2 text-sm transition-colors",
                currentStatus === folder.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 bg-white hover:bg-gray-50",
              )}
            >
              <FolderIcon className="size-4 opacity-75" />
              <span>
                <Trans i18nKey={i18nKey} defaults={folder.label} />
              </span>
              <span className="ml-1 rounded-full bg-gray-400/10 px-2 py-0.5 text-xs text-gray-600">
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
