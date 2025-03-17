"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rallly/ui/command";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useDebounce } from "react-use";

interface Poll {
  id: string;
  title: string;
  createdAt: Date;
}

interface SearchPollsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function searchPolls(query: string): Promise<Poll[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const response = await fetch(
    `/api/polls/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch polls");
  }

  const data = await response.json();
  return data.polls;
}

export function SearchPollsDialog({
  open,
  onOpenChange,
}: SearchPollsDialogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search to avoid excessive API calls
  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    200,
    [search],
  );

  // Reset search when dialog is closed
  React.useEffect(() => {
    if (!open) {
      // Don't clear the search input, just disable the query
      setDebouncedSearch("");
    }
  }, [open]);

  // Use React Query to fetch search results
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["searchPolls", debouncedSearch],
    queryFn: () => searchPolls(debouncedSearch),
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleSelectPoll = (poll: Poll) => {
    router.push(`/invite/${poll.id}`);
    onOpenChange(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput
          placeholder="Search polls..."
          value={search}
          onValueChange={setSearch}
          autoFocus={true}
        />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : debouncedSearch.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          ) : polls.length === 0 ? (
            <CommandEmpty>No results found</CommandEmpty>
          ) : (
            <CommandGroup>
              {polls.map((poll) => (
                <CommandItem
                  key={poll.id}
                  onSelect={() => handleSelectPoll(poll)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{poll.title}</span>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="mr-1 size-3" />
                    <span>{formatDate(poll.createdAt)}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
