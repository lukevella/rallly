"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import type { Industry } from "@/features/space/constants";
import { industries } from "@/features/space/constants";
import { Trans, useTranslation } from "@/i18n/client";

// Base UI treats null as "nothing selected"; the picklist needs a real value
// to hang the opt-out on, so it gets a sentinel that maps back to null.
const NONE_VALUE = "none";

function IndustryLabel({ industry }: { industry: Industry }) {
  switch (industry) {
    case "education":
      return <Trans i18nKey="industryEducation" defaults="Education" />;
    case "healthcare":
      return <Trans i18nKey="industryHealthcare" defaults="Healthcare" />;
    case "professional_services":
      return (
        <Trans
          i18nKey="industryProfessionalServices"
          defaults="Professional services"
        />
      );
    case "technology":
      return <Trans i18nKey="industryTechnology" defaults="Technology" />;
    case "non_profit":
      return <Trans i18nKey="industryNonProfit" defaults="Non-profit" />;
    case "government":
      return <Trans i18nKey="industryGovernment" defaults="Government" />;
    case "recruiting":
      return <Trans i18nKey="industryRecruiting" defaults="Recruiting" />;
    case "real_estate":
      return <Trans i18nKey="industryRealEstate" defaults="Real estate" />;
    case "religious_organisation":
      return (
        <Trans
          i18nKey="industryReligiousOrganisation"
          defaults="Religious organisation"
        />
      );
    case "arts_and_entertainment":
      return (
        <Trans
          i18nKey="industryArtsAndEntertainment"
          defaults="Arts and entertainment"
        />
      );
    case "hospitality":
      return <Trans i18nKey="industryHospitality" defaults="Hospitality" />;
    case "other":
      return <Trans i18nKey="industryOther" defaults="Other" />;
  }
}

/**
 * Sector picker for a work space. Optional by design — "prefer not to say"
 * clears it, which both keeps consent a workable legal basis and records
 * "none of these fit" as an answer in its own right.
 */
export function IndustrySelect({
  value,
  onValueChange,
  disabled,
  id,
}: {
  value?: Industry | null;
  onValueChange: (value: Industry | null) => void;
  disabled?: boolean;
  id?: string;
}) {
  const { t } = useTranslation();

  return (
    <Select<string | null, false>
      items={[
        {
          value: NONE_VALUE,
          label: t("industryNone", { defaultValue: "Prefer not to say" }),
        },
        ...industries.map((industry) => ({
          value: industry,
          label: <IndustryLabel industry={industry} />,
        })),
      ]}
      // Unset renders the placeholder rather than "Prefer not to say" — an
      // untouched optional field hasn't been answered either way, and the
      // opt-out item exists to clear a value that was set.
      value={value ?? null}
      onValueChange={(next) => {
        onValueChange(next === NONE_VALUE ? null : (next as Industry));
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue
          placeholder={t("industryPlaceholder", {
            defaultValue: "Select an industry...",
          })}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <Trans i18nKey="industryNone" defaults="Prefer not to say" />
        </SelectItem>
        {industries.map((industry) => (
          <SelectItem key={industry} value={industry}>
            <IndustryLabel industry={industry} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
