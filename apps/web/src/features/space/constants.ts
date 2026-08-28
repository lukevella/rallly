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
  "legal",
  "sports_and_recreation",
  "recruiting",
  "real_estate",
  "religious_organisation",
  "arts_and_entertainment",
  "hospitality",
  "other",
] as const;

export type Industry = (typeof industries)[number];

/**
 * Email domain suffixes that identify a sector on their own, matched as
 * complete suffixes rather than as individual labels. Individual labels are
 * not safe: "edu" appears in both "example.edu" (a university) and
 * "attacker.edu.com" (anyone at all), and only the first is evidence.
 *
 * Checked before the keyword table — a .edu address outranks any word in an
 * organization name. Free-mail domains (gmail.com, outlook.com) match nothing
 * here and fall through to the keyword check.
 *
 * Deliberately not a public-suffix list: this is a prefill the user confirms,
 * so covering the common registries beats carrying a dependency that has to
 * be kept current. A suffix that isn't listed simply yields no guess.
 */
export const industryDomainRules: ReadonlyArray<{
  suffixes: readonly string[];
  industry: Industry;
}> = [
  {
    suffixes: [
      "edu",
      "edu.au",
      "edu.sg",
      "edu.in",
      "ac.uk",
      "ac.nz",
      "ac.jp",
      "ac.za",
      "ac.at",
      "sch.uk",
    ],
    industry: "education",
  },
  {
    suffixes: [
      "gov",
      "mil",
      "gov.uk",
      "gov.au",
      "gov.in",
      "gov.za",
      "govt.nz",
      "gc.ca",
    ],
    industry: "government",
  },
  { suffixes: ["org", "org.uk", "org.au", "org.nz"], industry: "non_profit" },
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
      "law",
      "legal",
      "solicitors",
      "solicitor",
      "attorneys",
      "attorney",
      "barristers",
      "chambers",
      "notary",
      "llp",
    ],
    industry: "legal",
  },
  {
    keywords: [
      "sports",
      "sport",
      "athletic",
      "athletics",
      "fc",
      "football",
      "soccer",
      "rugby",
      "cricket",
      "hockey",
      "tennis",
      "golf",
      "rowing",
      "swimming",
      "gym",
      "fitness",
      "league",
    ],
    industry: "sports_and_recreation",
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
      "architects",
      "engineering",
      "partners",
      "associates",
      "services",
    ],
    industry: "professional_services",
  },
];
