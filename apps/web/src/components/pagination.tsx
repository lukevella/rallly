"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Trans } from "@/components/trans";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      navigateToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      navigateToPage(currentPage + 1);
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="text-gray-500 text-sm">
        <Trans
          i18nKey="paginationItems"
          defaults="Showing {startItem}–{endItem} of {totalItems}"
          values={{
            startItem,
            endItem,
            totalItems,
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          <Icon>
            <ChevronLeftIcon />
          </Icon>
          <span className="sr-only">
            <Trans i18nKey="paginationPrevious" defaults="Previous" />
          </span>
        </Button>
        <div className="text-sm">
          <Trans
            i18nKey="paginationPage"
            defaults="Page {currentPage, number} of {totalPages, number}"
            values={{
              currentPage,
              totalPages,
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">
            <Trans i18nKey="paginationNext" defaults="Next" />
          </span>
          <Icon>
            <ChevronRightIcon />
          </Icon>
        </Button>
      </div>
    </div>
  );
}
