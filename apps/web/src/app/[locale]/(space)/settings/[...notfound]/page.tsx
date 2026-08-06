import { FileSearchIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/i18n/client";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState>
        <EmptyStateIcon>
          <FileSearchIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="errors_notFoundTitle" defaults="404 not found" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="errors_notFoundDescription"
            defaults="We couldn't find the page you're looking for."
          />
        </EmptyStateDescription>
      </EmptyState>
    </div>
  );
}
