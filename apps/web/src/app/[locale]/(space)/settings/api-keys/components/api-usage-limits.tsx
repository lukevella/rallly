"use client";

import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import {
  API_RATE_LIMIT_PER_DAY,
  API_RATE_LIMIT_PER_MINUTE,
  getApiDocsPath,
} from "@/features/api-keys/constants";
import { Trans } from "@/i18n/client";

export function ApiUsageLimits() {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-muted-foreground text-sm">
            <Trans i18nKey="apiRateLimitLabel" defaults="Rate limit" />
          </span>
          <span className="font-medium text-sm tabular-nums">
            <Trans
              i18nKey="apiRateLimitValue"
              defaults="{count} requests / minute"
              values={{ count: API_RATE_LIMIT_PER_MINUTE }}
            />
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-muted-foreground text-sm">
            <Trans i18nKey="apiDailyLimitLabel" defaults="Daily limit" />
          </span>
          <span className="font-medium text-sm tabular-nums">
            <Trans
              i18nKey="apiDailyLimitValue"
              defaults="{count, number} requests / day"
              values={{ count: API_RATE_LIMIT_PER_DAY }}
            />
          </span>
        </div>
      </div>
      <Link
        href={getApiDocsPath()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary text-sm underline-offset-4 hover:underline"
      >
        <Trans i18nKey="apiViewDocs" defaults="View API docs" />
        <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}
