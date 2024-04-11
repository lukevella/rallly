"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { DownloadIcon } from "lucide-react";

import { useCsvExporter } from "@/components/poll/manage-poll/use-csv-exporter";
import { Trans } from "@/components/trans";

export function ExportToCSVButton() {
  const { exportToCsv } = useCsvExporter();
  return (
    <Button
      onClick={() => {
        exportToCsv();
      }}
    >
      <Icon>
        <DownloadIcon />
      </Icon>
      <Trans i18nKey="exportToCsv" />
    </Button>
  );
}
