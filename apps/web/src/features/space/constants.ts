import type { AssetProfile } from "@/lib/storage/asset-profile";

export const spaceIconAssetProfile = {
  id: "space-icon",
  keyPrefix: "spaces",
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
} as const satisfies AssetProfile;

/**
 * Self-declared sector for a work space. Deliberately a string union rather
 * than a Prisma enum: a v2 taxonomy is expected once override rates and
 * free-text roles are in, and changing a set of strings is lighter than an
 * enum migration. The first five mirror Doodle's Industries menu so the
 * segments are comparable.
 */
export const industries = [
  "education",
  "healthcare",
  "professional_services",
  "technology",
  "non_profit",
  "government",
  "recruiting",
  "real_estate",
  "religious_organisation",
  "arts_and_entertainment",
  "hospitality",
  "other",
] as const;

export type Industry = (typeof industries)[number];

/**
 * Email domain labels that identify a sector on their own — matched against
 * whole labels rather than a string suffix, so ".edu" doesn't also fire on
 * "acme.education.com". Checked before the keyword table: a .edu address is
 * stronger evidence than any word in an organization name. Free-mail domains
 * (gmail.com, outlook.com) match nothing here and fall through to the
 * keyword check.
 */
export const industryDomainRules: ReadonlyArray<{
  labels: readonly string[];
  industry: Industry;
}> = [
  { labels: ["edu", "ac", "sch"], industry: "education" },
  { labels: ["gov", "mil"], industry: "government" },
  { labels: ["org"], industry: "non_profit" },
];

/**
 * Organization name keywords, checked as whole words against a normalized
 * name when the domain yields nothing. Ordered by specificity: the first
 * entry whose keyword appears wins, so narrow sectors precede broad ones
 * ("clinic" before "services").
 */
export const industryKeywordRules: ReadonlyArray<{
  keywords: readonly string[];
  industry: Industry;
}> = [
  {
    keywords: [
      "school",
      "college",
      "university",
      "academy",
      "kindergarten",
      "preschool",
      "education",
      "institute",
      "faculty",
      "campus",
      "tutoring",
    ],
    industry: "education",
  },
  {
    keywords: [
      "hospital",
      "clinic",
      "medical",
      "health",
      "healthcare",
      "dental",
      "dentist",
      "physio",
      "physiotherapy",
      "therapy",
      "pharmacy",
      "veterinary",
      "vet",
      "care",
    ],
    industry: "healthcare",
  },
  {
    keywords: [
      "church",
      "parish",
      "chapel",
      "cathedral",
      "synagogue",
      "mosque",
      "temple",
      "ministry",
      "ministries",
      "diocese",
      "congregation",
    ],
    industry: "religious_organisation",
  },
  {
    keywords: [
      "recruiting",
      "recruitment",
      "recruiters",
      "staffing",
      "talent",
      "headhunting",
      "hiring",
    ],
    industry: "recruiting",
  },
  {
    keywords: [
      "realty",
      "estate",
      "estates",
      "properties",
      "property",
      "lettings",
      "brokerage",
    ],
    industry: "real_estate",
  },
  {
    keywords: [
      "charity",
      "foundation",
      "nonprofit",
      "ngo",
      "trust",
      "volunteers",
      "volunteering",
    ],
    industry: "non_profit",
  },
  {
    keywords: [
      "council",
      "municipality",
      "department",
      "agency",
      "bureau",
      "authority",
    ],
    industry: "government",
  },
  {
    keywords: [
      "software",
      "technologies",
      "technology",
      "tech",
      "digital",
      "labs",
      "systems",
      "data",
      "cloud",
      "cyber",
      "robotics",
      "ai",
    ],
    industry: "technology",
  },
  {
    keywords: [
      "hotel",
      "hostel",
      "resort",
      "restaurant",
      "cafe",
      "catering",
      "bistro",
      "brewery",
      "hospitality",
      "travel",
      "tours",
    ],
    industry: "hospitality",
  },
  {
    keywords: [
      "studio",
      "studios",
      "theatre",
      "theater",
      "gallery",
      "museum",
      "orchestra",
      "choir",
      "band",
      "productions",
      "media",
      "music",
      "dance",
      "film",
    ],
    industry: "arts_and_entertainment",
  },
  {
    keywords: [
      "consulting",
      "consultancy",
      "consultants",
      "advisory",
      "advisors",
      "accounting",
      "accountants",
      "law",
      "legal",
      "solicitors",
      "attorneys",
      "notary",
      "architects",
      "engineering",
      "partners",
      "associates",
      "services",
    ],
    industry: "professional_services",
  },
];
