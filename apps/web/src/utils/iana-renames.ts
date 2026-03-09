// Normalize legacy IANA IDs to their modern canonical equivalents.
// Runtimes may still resolve to deprecated IDs (e.g. "Europe/Kiev").
const ianaRenames: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
};

export function resolveTimezoneId(id: string): string {
  return ianaRenames[id] ?? id;
}
