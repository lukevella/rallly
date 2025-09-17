import { FileSearchIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState>
        <EmptyStateIcon>
          <FileSearchIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="errors_notFoundTitle" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans i18nKey="errors_notFoundDescription" />
        </EmptyStateDescription>
      </EmptyState>
    </div>
  );
}
