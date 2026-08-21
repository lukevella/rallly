"use client";

import { Input } from "@rallly/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import React from "react";
import type { JobTitle } from "@/features/user/constants";
import {
  JOB_TITLE_OTHER_MAX_LENGTH,
  jobTitles,
} from "@/features/user/constants";
import { Trans, useTranslation } from "@/i18n/client";

// Base UI treats null as "nothing selected"; the picklist needs a real value
// to hang the opt-out on, so it gets a sentinel that maps back to null.
const NONE_VALUE = "none";

function isPicklistValue(value: string): value is JobTitle {
  return (jobTitles as readonly string[]).includes(value);
}

function JobTitleLabel({ jobTitle }: { jobTitle: JobTitle }) {
  switch (jobTitle) {
    case "executive_assistant":
      return (
        <Trans
          i18nKey="jobTitleExecutiveAssistant"
          defaults="Executive assistant"
        />
      );
    case "administrator_or_coordinator":
      return (
        <Trans
          i18nKey="jobTitleAdministratorOrCoordinator"
          defaults="Administrator or coordinator"
        />
      );
    case "manager_or_team_lead":
      return (
        <Trans
          i18nKey="jobTitleManagerOrTeamLead"
          defaults="Manager or team lead"
        />
      );
    case "recruiter":
      return <Trans i18nKey="jobTitleRecruiter" defaults="Recruiter" />;
    case "teacher_or_lecturer":
      return (
        <Trans
          i18nKey="jobTitleTeacherOrLecturer"
          defaults="Teacher or lecturer"
        />
      );
    case "healthcare_practitioner":
      return (
        <Trans
          i18nKey="jobTitleHealthcarePractitioner"
          defaults="Healthcare practitioner"
        />
      );
    case "consultant_or_freelancer":
      return (
        <Trans
          i18nKey="jobTitleConsultantOrFreelancer"
          defaults="Consultant or freelancer"
        />
      );
    case "founder_or_owner":
      return (
        <Trans i18nKey="jobTitleFounderOrOwner" defaults="Founder or owner" />
      );
    case "sales":
      return <Trans i18nKey="jobTitleSales" defaults="Sales" />;
    case "other":
      return <Trans i18nKey="jobTitleOther" defaults="Other" />;
  }
}

/**
 * Role picker. The stored value is either a picklist key or, behind "Other",
 * whatever the user typed — one value, so the caller stores exactly what it
 * receives. Picking "Other" and typing nothing still stores "other": "none of
 * these fit" is an answer worth keeping, and the free text is what the v2
 * taxonomy will be built from.
 */
export function JobTitleSelect({
  value,
  onValueChange,
  disabled,
  id,
}: {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  id?: string;
}) {
  const { t } = useTranslation();

  // The text lives here rather than in the stored value so clearing the input
  // doesn't collapse the selection back to "nothing chosen".
  const [otherText, setOtherText] = React.useState(
    value && !isPicklistValue(value) ? value : "",
  );

  // Unset renders the placeholder rather than "Prefer not to say" — an
  // untouched optional field hasn't been answered either way, and the opt-out
  // item exists to clear a value that was set.
  const selected = value ? (isPicklistValue(value) ? value : "other") : null;

  return (
    <div className="space-y-2">
      <Select<string | null, false>
        items={[
          {
            value: NONE_VALUE,
            label: t("jobTitleNone", { defaultValue: "Prefer not to say" }),
          },
          ...jobTitles.map((jobTitle) => ({
            value: jobTitle,
            label: <JobTitleLabel jobTitle={jobTitle} />,
          })),
        ]}
        value={selected}
        onValueChange={(next) => {
          if (next === NONE_VALUE) {
            onValueChange(null);
          } else if (next === "other") {
            onValueChange(otherText.trim() || "other");
          } else {
            onValueChange(next as JobTitle);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={t("jobTitlePlaceholder", {
              defaultValue: "Select a role...",
            })}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>
            <Trans i18nKey="jobTitleNone" defaults="Prefer not to say" />
          </SelectItem>
          {jobTitles.map((jobTitle) => (
            <SelectItem key={jobTitle} value={jobTitle}>
              <JobTitleLabel jobTitle={jobTitle} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected === "other" ? (
        <Input
          value={otherText}
          maxLength={JOB_TITLE_OTHER_MAX_LENGTH}
          disabled={disabled}
          aria-label={t("jobTitleOtherLabel", {
            defaultValue: "Describe your role",
          })}
          placeholder={t("jobTitleOtherPlaceholder", {
            defaultValue: "e.g. Practice manager",
          })}
          onChange={(event) => {
            const next = event.target.value;
            setOtherText(next);
            onValueChange(next.trim() || "other");
          }}
        />
      ) : null}
    </div>
  );
}
