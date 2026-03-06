import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const soft = require("timezone-soft");
const spacetime = require("spacetime");

const __dirname = dirname(fileURLToPath(import.meta.url));

// Curated list of major cities/timezones (~150)
// Covers all UTC offsets and major population centers
const curatedTimezones = [
  // UTC-12 to UTC-10
  "Pacific/Pago_Pago",
  "Pacific/Honolulu",

  // UTC-9 to UTC-8
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Tijuana",
  "America/Vancouver",

  // UTC-7
  "America/Denver",
  "America/Edmonton",
  "America/Phoenix",

  // UTC-6
  "America/Chicago",
  "America/Guatemala",
  "America/Mexico_City",
  "America/Winnipeg",

  // UTC-5
  "America/Bogota",
  "America/Cancun",
  "America/Havana",
  "America/Indianapolis",
  "America/Jamaica",
  "America/Lima",
  "America/New_York",
  "America/Panama",
  "America/Toronto",

  // UTC-4
  "America/Barbados",
  "America/Caracas",
  "America/Halifax",
  "America/La_Paz",
  "America/Puerto_Rico",
  "America/Santiago",
  "America/Santo_Domingo",

  // UTC-3.5
  "America/St_Johns",

  // UTC-3
  "America/Argentina/Buenos_Aires",
  "America/Asuncion",
  "America/Montevideo",
  "America/Sao_Paulo",

  // UTC-2
  "America/Noronha",
  "Atlantic/South_Georgia",

  // UTC-1
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",

  // UTC+0
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Casablanca",
  "Africa/Monrovia",
  "Atlantic/Reykjavik",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/London",

  // UTC+1
  "Africa/Algiers",
  "Africa/Lagos",
  "Africa/Tunis",
  "Europe/Amsterdam",
  "Europe/Belgrade",
  "Europe/Berlin",
  "Europe/Brussels",
  "Europe/Budapest",
  "Europe/Copenhagen",
  "Europe/Madrid",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",

  // UTC+2
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Asia/Beirut",
  "Asia/Jerusalem",
  "Europe/Athens",
  "Europe/Bucharest",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Kyiv",
  "Europe/Riga",
  "Europe/Sofia",
  "Europe/Tallinn",
  "Europe/Vilnius",

  // UTC+3
  "Africa/Addis_Ababa",
  "Asia/Baghdad",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Riyadh",
  "Europe/Minsk",
  "Europe/Moscow",

  // UTC+3:30
  "Asia/Tehran",

  // UTC+4
  "Asia/Baku",
  "Asia/Dubai",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "Indian/Mauritius",

  // UTC+4:30
  "Asia/Kabul",

  // UTC+5
  "Asia/Karachi",
  "Asia/Tashkent",
  "Asia/Yekaterinburg",

  // UTC+5:30
  "Asia/Colombo",
  "Asia/Kolkata",

  // UTC+5:45
  "Asia/Kathmandu",

  // UTC+6
  "Asia/Almaty",
  "Asia/Dhaka",
  "Asia/Omsk",

  // UTC+6:30
  "Asia/Yangon",

  // UTC+7
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Krasnoyarsk",
  "Asia/Ho_Chi_Minh",

  // UTC+8
  "Asia/Hong_Kong",
  "Asia/Kuala_Lumpur",
  "Asia/Macau",
  "Asia/Manila",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Australia/Perth",

  // UTC+9
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Yakutsk",

  // UTC+9:30
  "Australia/Adelaide",
  "Australia/Darwin",

  // UTC+10
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Pacific/Guam",
  "Pacific/Port_Moresby",

  // UTC+11
  "Asia/Magadan",
  "Pacific/Guadalcanal",
  "Pacific/Noumea",

  // UTC+12
  "Asia/Kamchatka",
  "Pacific/Auckland",
  "Pacific/Fiji",

  // UTC+13
  "Pacific/Apia",
  "Pacific/Tongatapu",
];

// Override display names for cities where IANA ID doesn't match common usage
const cityOverrides = {
  "America/Argentina/Buenos_Aires": "Buenos Aires",
  "America/Indianapolis": "Indianapolis",
};

function getCityFromIana(iana) {
  if (cityOverrides[iana]) return cityOverrides[iana];
  const lastSlash = iana.lastIndexOf("/");
  const raw = iana.substring(lastSlash + 1);
  return raw.replaceAll("_", " ");
}

function formatOffset(offsetHours) {
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildKeywords(entry) {
  const parts = [
    entry.city,
    entry.iana,
    entry.standardAbbr,
    entry.daylightAbbr,
    entry.longDescription,
    entry.standardName,
  ].filter(Boolean);

  return parts.join(" ").toLowerCase();
}

const curatedSet = new Set(curatedTimezones);

function buildEntry(iana) {
  const now = spacetime.now(iana);
  const softData = soft(iana)[0];
  const isDST = now.isDST();

  const abbr = isDST
    ? (softData?.daylight?.abbr ?? softData?.standard?.abbr ?? "")
    : (softData?.standard?.abbr ?? "");

  const offsetHours = now.timezone().current.offset;
  const offsetMinutes = offsetHours * 60;
  const city = getCityFromIana(iana);

  const keywords = buildKeywords({
    iana,
    city,
    standardAbbr: softData?.standard?.abbr ?? "",
    daylightAbbr: softData?.daylight?.abbr ?? "",
    longDescription: softData?.long ?? "",
    standardName: softData?.standard?.name ?? "",
  });

  return {
    id: iana,
    city,
    offsetMinutes,
    offsetLabel: formatOffset(offsetHours),
    abbr,
    keywords,
    curated: curatedSet.has(iana),
  };
}

// Legacy IANA aliases that exist in production databases but aren't returned
// by Intl.supportedValuesOf("timeZone"). We include them so existing DB values
// are always findable in the picker.
const legacyAliases = [
  "America/Indiana/Indianapolis",
  "America/Montreal",
  "America/Santa_Isabel",
  "Pacific/Johnston",
];

// Build entries for all IANA timezones
const allTimezones = Intl.supportedValuesOf("timeZone");

// Add legacy aliases that aren't already in the list
const allTimezoneSet = new Set(allTimezones);
for (const alias of legacyAliases) {
  if (!allTimezoneSet.has(alias)) {
    allTimezones.push(alias);
  }
}

const entries = allTimezones.map(buildEntry);

// Sort by offset
entries.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

// Generate TS file with unquoted keys for Biome compatibility
function entryToTs(entry) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `  {
    id: "${esc(entry.id)}",
    city: "${esc(entry.city)}",
    offsetMinutes: ${entry.offsetMinutes},
    offsetLabel: "${esc(entry.offsetLabel)}",
    abbr: "${esc(entry.abbr)}",
    keywords: "${esc(entry.keywords)}",
    curated: ${entry.curated},
  }`;
}

const entriesTs = entries.map(entryToTs).join(",\n");

const output = `// This file is auto-generated by scripts/generate-timezone-data.mjs
// Do not edit manually. Run: pnpm tz:generate

export interface TimezoneEntry {
  id: string;
  city: string;
  offsetMinutes: number;
  offsetLabel: string;
  abbr: string;
  keywords: string;
  curated: boolean;
}

export const timezoneEntries: TimezoneEntry[] = [
${entriesTs},
];
`;

const outPath = resolve(
  __dirname,
  "../src/components/time-zone-picker/timezone-data.ts",
);
writeFileSync(outPath, output, "utf-8");

// Run Biome to format the generated file
import { execSync } from "node:child_process";

try {
  execSync(`npx biome check --write ${outPath}`, {
    cwd: resolve(__dirname, ".."),
    stdio: "inherit",
  });
} catch {
  // Biome may not be available, that's ok
}

console.log(`Generated ${entries.length} timezone entries to ${outPath}`);
