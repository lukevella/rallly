"use client";

import { ExportToCSVButton } from "@/app/[locale]/(admin)/poll/[urlId]/responses/export-to-csv-button";
import { VotingForm } from "@/components/poll/voting-form";
import { PollViz } from "@/components/poll-viz";

export default function Page() {
  return (
    <div className="space-y-4">
      <VotingForm>
        <PollViz />
      </VotingForm>
      <div className="flex justify-end">
        <ExportToCSVButton />
      </div>
    </div>
  );
}
